// ========= PDD APP - MAIN MODULE =========
// Depends on: i18n.js, storage.js, app.css

const QUESTIONS_PER_BILET = 20;
const EXAM_DURATION = 25 * 60; // 25 minutes in seconds
const EXAM_QUESTIONS = 20;

// ========= APP STATE =========
const App = {
  questions: [],       // raw normalized questions
  bilets: [],          // auto-split bilets
  rawData: null,       // original uploaded data (for new format)
  progress: null,      // saved progress
  screen: 'home',      // home | bilet | exam | upload
  currentBilet: -1,
  currentQuestion: 0,
  exam: null,          // active exam state
  examTimer: null,

  // === INIT ===
  async init() {
    // Load theme
    const theme = Storage.loadTheme();
    this.applyTheme(theme);

    // Load language
    window.APP_LANG = Storage.loadLang();

    // Init IndexedDB
    await Storage.initDB();

    // Init sync
    Sync.init();

    // Load questions from IndexedDB/localStorage
    const savedQ = await Storage.loadQuestions();
    if (savedQ) {
      if (this.isNewFormat(savedQ)) {
        this.rawData = savedQ;
        this.loadFromNewFormat(savedQ);
      } else if (Array.isArray(savedQ) && savedQ.length) {
        this.questions = savedQ;
        this.buildBilets();
      }
    }

    // Load local progress
    this.progress = Storage.loadProgress() || this.defaultProgress();

    // Try server sync
    try {
      const serverProgress = await Sync.pull();
      if (serverProgress) {
        this.progress = Sync.merge(this.progress, serverProgress);
        Storage.saveProgress(this.progress);
      }
    } catch(e) {}

    // Restore exam state if active
    if (this.progress.activeExam) {
      this.exam = this.progress.activeExam;
    }

    this.render();
  },

  defaultProgress() {
    return {
      biletAnswers: {},    // { biletIndex: { questionId: { selected, correct } } }
      biletScores: {},     // { biletIndex: { correct, wrong, total } }
      currentBilet: -1,
      currentQuestion: 0,
      examHistory: [],
      activeExam: null,
      updatedAt: Date.now()
    };
  },

  // === THEME ===
  applyTheme(theme) {
    const html = document.documentElement;
    html.removeAttribute('data-theme');
    if (theme === 'light') html.setAttribute('data-theme', 'light');
    else if (theme === 'dark') { /* default is dark */ }
    else {
      // auto
      if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        html.setAttribute('data-theme', 'light');
      }
    }
    Storage.saveTheme(theme);
    this._currentTheme = theme;
  },

  cycleTheme() {
    const themes = ['dark', 'light', 'auto'];
    const idx = themes.indexOf(this._currentTheme || 'auto');
    const next = themes[(idx + 1) % themes.length];
    this.applyTheme(next);
    this.render();
  },

  // === LANGUAGE ===
  cycleLang() {
    const langs = ['uz_latn', 'uz_cyrl', 'ru'];
    const idx = langs.indexOf(window.APP_LANG);
    window.APP_LANG = langs[(idx + 1) % langs.length];
    Storage.saveLang(window.APP_LANG);
    // Yangi formatda til o'zgarsa savollarni qayta yuklash
    if (this.rawData && this.isNewFormat(this.rawData)) {
      this.loadFromNewFormat(this.rawData);
    }
    this.render();
  },

  getLangLabel() {
    const m = { uz_latn: "O'z", uz_cyrl: 'Ўз', ru: 'Ру' };
    return m[window.APP_LANG] || "O'z";
  },

  getThemeIcon() {
    const m = { dark: '🌙', light: '☀️', auto: '🔄' };
    return m[this._currentTheme || 'auto'];
  },

  // === BILET BUILDING ===
  buildBilets() {
    this.bilets = [];
    for (let i = 0; i < this.questions.length; i += QUESTIONS_PER_BILET) {
      this.bilets.push(this.questions.slice(i, i + QUESTIONS_PER_BILET));
    }
  },

  // === NEW FORMAT DETECTION ===
  isNewFormat(data) {
    return data && !Array.isArray(data) && (data.uzb || data.kril || data.rus);
  },

  // === NEW FORMAT LOADER ===
  loadFromNewFormat(data) {
    const lang = window.APP_LANG || 'uz_latn';
    const langKey = lang === 'uz_cyrl' ? 'kril' : lang === 'ru' ? 'rus' : 'uzb';
    const questions = data[langKey] || data.uzb || [];
    this.questions = questions.map((q, idx) => ({
      id: q.id || idx + 1,
      savol: q.savol || '',
      savol_kril: q.savol || '',  // yangi formatda har til o'z arrayida
      savol_rus: q.savol || '',
      rasm: q.rasm || '',
      javob_1: q.javob_1 || '',
      javob_2: q.javob_2 || '',
      javob_3: q.javob_3 || '',
      javob_4: q.javob_4 || '',
      javob_1_kril: q.javob_1 || '',
      javob_2_kril: q.javob_2 || '',
      javob_3_kril: q.javob_3 || '',
      javob_4_kril: q.javob_4 || '',
      javob_1_rus: q.javob_1 || '',
      javob_2_rus: q.javob_2 || '',
      javob_3_rus: q.javob_3 || '',
      javob_4_rus: q.javob_4 || '',
      togri_javob_raqami: q.togri_javob_raqami || 1,
    }));
    this.buildBilets();
  },

  // === QUESTION NORMALIZATION (old format) ===
  normalizeQuestions(rawData) {
    return rawData.map((q, idx) => {
      const norm = {
        id: q.id || idx + 1,
        savol: q.savol || '',
        savol_kril: q.savol_kril || '',
        savol_rus: q.savol_rus || '',
        rasm: q.rasm || '',
        javob_1: q.javob_1 || '',
        javob_2: q.javob_2 || '',
        javob_3: q.javob_3 || '',
        javob_4: q.javob_4 || '',
        javob_1_kril: q.javob_1_kril || '',
        javob_2_kril: q.javob_2_kril || '',
        javob_3_kril: q.javob_3_kril || '',
        javob_4_kril: q.javob_4_kril || '',
        javob_1_rus: q.javob_1_rus || '',
        javob_2_rus: q.javob_2_rus || '',
        javob_3_rus: q.javob_3_rus || '',
        javob_4_rus: q.javob_4_rus || '',
        togri_javob_raqami: q.togri_javob_raqami || 1,
      };
      return norm;
    });
  },

  getAnswers(q) {
    const answers = [];
    for (let i = 1; i <= 4; i++) {
      const text = getAnswerText(q, `javob_${i}`);
      if (text && text.trim()) {
        answers.push({ idx: i, text, correct: i === q.togri_javob_raqami });
      }
    }
    return answers;
  },

  // === SAVE PROGRESS ===
  save() {
    Storage.saveProgress(this.progress);
    Sync.schedulePush();
  },

  // === FILE LOADING ===
  handleFileUpload(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let data = JSON.parse(e.target.result);

        // NEW FORMAT: { uzb: [...], kril: [...], rus: [...] }
        if (this.isNewFormat(data)) {
          this.rawData = data;
          Storage.saveQuestions(data);
          this.loadFromNewFormat(data);
          this.progress = this.defaultProgress();
          this.save();
          const lang = window.APP_LANG || 'uz_latn';
          const langKey = lang === 'uz_cyrl' ? 'kril' : lang === 'ru' ? 'rus' : 'uzb';
          const count = (data[langKey] || data.uzb || []).length;
          showToast(t('questionsLoaded').replace('{n}', count), 'success');
          this.screen = 'home';
          this.render();
          return;
        }

        // OLD FORMAT: array
        if (!Array.isArray(data) || data.length === 0) {
          showToast(t('invalidJson'), 'warn');
          return;
        }
        // Validate first item has at least savol
        if (!data[0].savol && !data[0].savol_rus && !data[0].question) {
          showToast(t('invalidJson'), 'warn');
          return;
        }
        // Handle ptest format
        if (data[0].question && data[0].answers) {
          data = data.map((q, i) => ({
            id: q.id || i + 1,
            savol: q.question?.lot || q.question?.kril || '',
            savol_kril: q.question?.kril || '',
            savol_rus: q.question?.rus || '',
            rasm: q.photo || '',
            javob_1: q.answers?.[0]?.label?.lot || '',
            javob_2: q.answers?.[1]?.label?.lot || '',
            javob_3: q.answers?.[2]?.label?.lot || '',
            javob_4: q.answers?.[3]?.label?.lot || '',
            togri_javob_raqami: (q.answers?.findIndex(a => a.is_answer) + 1) || 1
          }));
        }

        this.rawData = null;
        this.questions = this.normalizeQuestions(data);
        this.buildBilets();

        // Reset progress for new data
        this.progress = this.defaultProgress();

        // Save questions and progress
        Storage.saveQuestions(this.questions);
        this.save();

        showToast(t('questionsLoaded').replace('{n}', this.questions.length), 'success');
        this.screen = 'home';
        this.render();
      } catch(err) {
        showToast(t('invalidJson') + ': ' + err.message, 'warn');
      }
    };
    reader.readAsText(file);
  },

  // === BILET STATUS ===
  getBiletStatus(biletIdx) {
    const answers = this.progress.biletAnswers?.[biletIdx] || {};
    const bilet = this.bilets[biletIdx];
    if (!bilet) return { status: 'not_started', answered: 0, total: 0, correct: 0, wrong: 0 };

    const total = bilet.length;
    const answered = Object.keys(answers).length;
    const correct = Object.values(answers).filter(a => a.correct).length;
    const wrong = answered - correct;

    if (answered === 0) return { status: 'not_started', answered, total, correct, wrong };
    if (answered >= total) return { status: 'completed', answered, total, correct, wrong };
    return { status: 'in_progress', answered, total, correct, wrong };
  },

  getOverallStats() {
    let totalAnswered = 0, totalCorrect = 0, totalQuestions = this.questions.length;
    for (let i = 0; i < this.bilets.length; i++) {
      const s = this.getBiletStatus(i);
      totalAnswered += s.answered;
      totalCorrect += s.correct;
    }
    return { totalQuestions, totalAnswered, totalCorrect, totalWrong: totalAnswered - totalCorrect };
  },

  getUnfinishedBilet() {
    for (let i = 0; i < this.bilets.length; i++) {
      const s = this.getBiletStatus(i);
      if (s.status === 'in_progress') return i;
    }
    return -1;
  },

  // === ESCAPING ===
  esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  },

  // === TOAST ===
};

function showToast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}
