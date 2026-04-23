// ========= STORAGE & SYNC MODULE =========

const Storage = {
  // === IndexedDB for large data (questions JSON) ===
  _dbName: 'pdd_app',
  _dbVersion: 1,
  _db: null,

  async initDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this._dbName, this._dbVersion);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('questions')) {
          db.createObjectStore('questions', { keyPath: 'key' });
        }
      };
      req.onsuccess = (e) => { this._db = e.target.result; resolve(); };
      req.onerror = () => { console.warn('IndexedDB failed, using localStorage fallback'); resolve(); };
    });
  },

  async saveQuestions(data) {
    if (this._db) {
      try {
        const tx = this._db.transaction('questions', 'readwrite');
        tx.objectStore('questions').put({ key: 'main', data });
        await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej; });
        return;
      } catch(e) { console.warn('IDB save fail:', e); }
    }
    // Fallback
    try { localStorage.setItem('pdd_questions', JSON.stringify(data)); } catch(e) { console.warn('LS save fail:', e); }
  },

  async loadQuestions() {
    if (this._db) {
      try {
        const tx = this._db.transaction('questions', 'readonly');
        const req = tx.objectStore('questions').get('main');
        const result = await new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = rej; });
        if (result && result.data) return result.data;
      } catch(e) { console.warn('IDB load fail:', e); }
    }
    try {
      const s = localStorage.getItem('pdd_questions');
      return s ? JSON.parse(s) : null;
    } catch(e) { return null; }
  },

  // === localStorage for progress (smaller data) ===
  getUserId() {
    let uid = localStorage.getItem('pdd_user_id');
    if (!uid) {
      uid = 'u_' + crypto.randomUUID();
      localStorage.setItem('pdd_user_id', uid);
    }
    return uid;
  },

  saveProgress(progress) {
    try {
      progress.updatedAt = Date.now();
      localStorage.setItem('pdd_progress', JSON.stringify(progress));
    } catch(e) { console.warn('Progress save fail:', e); }
  },

  loadProgress() {
    try {
      const s = localStorage.getItem('pdd_progress');
      return s ? JSON.parse(s) : null;
    } catch(e) { return null; }
  },

  saveLang(lang) { localStorage.setItem('pdd_lang', lang); },
  loadLang() { return localStorage.getItem('pdd_lang') || 'uz_latn'; },

  saveTheme(theme) { localStorage.setItem('pdd_theme', theme); },
  loadTheme() { return localStorage.getItem('pdd_theme') || 'auto'; },

  clearAll() {
    localStorage.removeItem('pdd_progress');
    localStorage.removeItem('pdd_questions');
    if (this._db) {
      try {
        const tx = this._db.transaction('questions', 'readwrite');
        tx.objectStore('questions').clear();
      } catch(e) {}
    }
  }
};

// ========= SERVER SYNC =========
const Sync = {
  _baseUrl: '',  // same origin
  _debounceTimer: null,
  _syncing: false,
  _online: navigator.onLine,

  init() {
    window.addEventListener('online', () => { this._online = true; this.push(); });
    window.addEventListener('offline', () => { this._online = false; });
  },

  // Push progress to server (debounced)
  schedulePush() {
    clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(() => this.push(), 2000);
  },

  async push() {
    if (!this._online || this._syncing) return;
    this._syncing = true;
    try {
      const progress = Storage.loadProgress();
      if (!progress) return;
      const userId = Storage.getUserId();
      const resp = await fetch(`/api/progress/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(progress)
      });
      if (resp.ok) {
        console.log('✅ Progress synced to server');
      }
    } catch(e) {
      console.log('⚠️ Server sync failed (offline mode)');
    } finally {
      this._syncing = false;
    }
  },

  async pull() {
    if (!this._online) return null;
    try {
      const userId = Storage.getUserId();
      const resp = await fetch(`/api/progress/${userId}`);
      if (!resp.ok) return null;
      const json = await resp.json();
      if (json.exists && json.data) return json.data;
    } catch(e) {
      console.log('⚠️ Server pull failed');
    }
    return null;
  },

  // Merge: pick the most recent + merge answered
  merge(local, server) {
    if (!local && !server) return null;
    if (!local) return server;
    if (!server) return local;

    const localTime = local.updatedAt || 0;
    const serverTime = server.updatedAt || 0;

    // Use more recent as base, but merge answered data
    const base = serverTime > localTime ? { ...server } : { ...local };
    const other = serverTime > localTime ? local : server;

    // Merge bilet answers (don't lose any)
    if (base.biletAnswers && other.biletAnswers) {
      for (const key of Object.keys(other.biletAnswers)) {
        if (!base.biletAnswers[key]) {
          base.biletAnswers[key] = other.biletAnswers[key];
        } else {
          // Merge individual question answers
          const baseAns = base.biletAnswers[key];
          const otherAns = other.biletAnswers[key];
          for (const qId of Object.keys(otherAns)) {
            if (!baseAns[qId]) baseAns[qId] = otherAns[qId];
          }
        }
      }
    }

    // Merge exam history
    if (other.examHistory && other.examHistory.length) {
      if (!base.examHistory) base.examHistory = [];
      const existingIds = new Set(base.examHistory.map(e => e.startedAt));
      for (const exam of other.examHistory) {
        if (!existingIds.has(exam.startedAt)) base.examHistory.push(exam);
      }
    }

    base.updatedAt = Date.now();
    return base;
  }
};
