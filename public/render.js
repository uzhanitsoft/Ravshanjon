// ========= RENDER MODULE =========
// Depends on: app.js, i18n.js

App.render = function() {
  const root = document.getElementById('app');
  if (!root) return;

  if (this.screen === 'bilet') { root.innerHTML = this.renderBiletScreen(); this.bindBiletEvents(); return; }
  if (this.screen === 'exam') { root.innerHTML = this.renderExamScreen(); this.bindExamEvents(); return; }
  
  // Home screen
  root.innerHTML = this.renderHomeScreen();
  this.bindHomeEvents();
};

// ========= HOME SCREEN =========
App.renderHomeScreen = function() {
  const stats = this.getOverallStats();
  const unfinished = this.getUnfinishedBilet();
  const hasData = this.questions.length > 0;
  const accuracy = stats.totalAnswered > 0 ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100) : 0;

  let html = `
    <div class="header">
      <h1>🚗 ${t('appTitle')}</h1>
      <p>${t('appSubtitle')}</p>
    </div>

    <div class="top-bar">
      <div class="top-bar-left">
        <button class="lang-btn active" id="btn-lang">${this.getLangLabel()}</button>
      </div>
      <div class="top-bar-right">
        <button class="icon-btn" id="btn-theme" title="${t('theme')}">${this.getThemeIcon()}</button>
      </div>
    </div>`;

  if (!hasData) {
    // Empty state - upload
    html += this.renderUploadState();
  } else {
    // Stats
    html += `
    <div class="stats-grid">
      <div class="stat-card"><div class="num">${stats.totalQuestions}</div><div class="label">${t('totalQuestions')}</div></div>
      <div class="stat-card"><div class="num" style="color:var(--green)">${stats.totalAnswered}</div><div class="label">${t('solved')}</div></div>
      <div class="stat-card"><div class="num" style="color:var(--green)">${stats.totalCorrect}</div><div class="label">${t('correct')}</div></div>
      <div class="stat-card"><div class="num" style="color:${accuracy >= 70 ? 'var(--green)' : 'var(--yellow)'}">${accuracy}%</div><div class="label">${t('accuracy')}</div></div>
    </div>`;

    // Continue banner
    if (unfinished >= 0) {
      const us = this.getBiletStatus(unfinished);
      html += `
      <div class="continue-banner" id="btn-continue" data-bilet="${unfinished}">
        <div class="cont-icon">▶️</div>
        <div class="cont-text">
          <h3>${t('continueText')}</h3>
          <p>${t('continueDesc').replace('{n}', unfinished + 1).replace('{q}', us.answered + 1).replace('{t}', us.total)}</p>
        </div>
      </div>`;
    }

    // Active exam banner
    if (this.progress.activeExam) {
      html += `
      <div class="continue-banner" id="btn-cont-exam" style="border-color: rgba(234,179,8,0.4); background: linear-gradient(135deg, rgba(234,179,8,0.1), rgba(249,115,22,0.08));">
        <div class="cont-icon">⏱️</div>
        <div class="cont-text">
          <h3>${t('continueExam')}</h3>
          <p>${t('examMode')} — ${Math.ceil((this.progress.activeExam.timeRemaining || 0) / 60)} min</p>
        </div>
      </div>`;
    }

    // Action buttons
    html += `
    <div class="action-grid">
      <div class="action-btn" id="btn-upload"><span class="action-icon">📁</span><span>${t('loadJson')}</span></div>
      <div class="action-btn" id="btn-reset"><span class="action-icon">🗑️</span><span>${t('resetProgress')}</span></div>
      ${!this.progress.activeExam ? `<div class="action-btn exam-btn" id="btn-exam"><span class="action-icon">🎓</span><span>${t('startExam')}</span></div>` : ''}
    </div>`;

    // Bilet grid
    html += `<div class="section-title">📋 ${t('tickets')} (${this.bilets.length})</div>`;
    html += '<div class="bilet-grid">';
    for (let i = 0; i < this.bilets.length; i++) {
      const s = this.getBiletStatus(i);
      let cardClass = 'bilet-card';
      if (s.status === 'completed') cardClass += ' completed';
      if (s.status === 'in_progress') cardClass += ' in-progress';

      const statusText = s.status === 'completed' ? t('completed') : 
                         s.status === 'in_progress' ? t('inProgress') : t('notStarted');
      const pct = s.total > 0 ? Math.round((s.answered / s.total) * 100) : 0;

      let scoreHtml = '';
      if (s.status === 'completed') {
        const pctCorrect = Math.round((s.correct / s.total) * 100);
        scoreHtml = `<div class="bilet-score" style="color:${pctCorrect >= 70 ? 'var(--green)' : 'var(--red)'}">${s.correct}/${s.total} (${pctCorrect}%)</div>`;
      }

      html += `
      <div class="${cardClass}" data-bilet="${i}">
        <div class="bilet-num">${t('ticket')} ${i + 1}</div>
        <div class="bilet-status">${statusText} · ${s.answered}/${s.total}</div>
        <div class="bilet-progress-bar"><div class="bilet-progress-fill" style="width:${pct}%"></div></div>
        ${scoreHtml}
      </div>`;
    }
    html += '</div>';
  }

  return html;
};

App.renderUploadState = function() {
  return `
    <div style="padding: 40px 0;">
      <div class="upload-zone" id="upload-zone">
        <div class="icon">📂</div>
        <h3>${t('uploadTitle')}</h3>
        <p>${t('uploadDesc')}</p>
        <input type="file" id="file-input" accept=".json">
        <button class="upload-btn-main" id="btn-choose-file">${t('chooseFile')}</button>
      </div>
    </div>`;
};

App.bindHomeEvents = function() {
  const self = this;

  document.getElementById('btn-lang')?.addEventListener('click', () => self.cycleLang());
  document.getElementById('btn-theme')?.addEventListener('click', () => self.cycleTheme());

  document.getElementById('btn-continue')?.addEventListener('click', function() {
    const bi = parseInt(this.dataset.bilet);
    self.openBilet(bi);
  });

  document.getElementById('btn-cont-exam')?.addEventListener('click', () => {
    self.exam = self.progress.activeExam;
    self.screen = 'exam';
    self.render();
    self.startExamTimer();
  });

  document.querySelectorAll('.bilet-card').forEach(card => {
    card.addEventListener('click', function() {
      const bi = parseInt(this.dataset.bilet);
      self.openBilet(bi);
    });
  });

  document.getElementById('btn-upload')?.addEventListener('click', () => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json';
    inp.onchange = (e) => self.handleFileUpload(e.target.files[0]);
    inp.click();
  });

  document.getElementById('btn-reset')?.addEventListener('click', () => {
    self.showConfirmModal(t('resetConfirm'), () => {
      self.progress = self.defaultProgress();
      Storage.clearAll();
      self.questions = [];
      self.bilets = [];
      self.save();
      self.render();
      showToast(t('resetProgress') + ' ✓', 'success');
    });
  });

  document.getElementById('btn-exam')?.addEventListener('click', () => self.startExam());

  // Upload zone events
  document.getElementById('btn-choose-file')?.addEventListener('click', () => {
    document.getElementById('file-input')?.click();
  });
  document.getElementById('file-input')?.addEventListener('change', (e) => {
    self.handleFileUpload(e.target.files[0]);
  });
  const zone = document.getElementById('upload-zone');
  if (zone) {
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.style.borderColor = 'var(--primary)'; });
    zone.addEventListener('dragleave', () => { zone.style.borderColor = ''; });
    zone.addEventListener('drop', (e) => {
      e.preventDefault(); zone.style.borderColor = '';
      if (e.dataTransfer.files.length) self.handleFileUpload(e.dataTransfer.files[0]);
    });
  }
};

// ========= CONFIRM MODAL =========
App.showConfirmModal = function(message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-content">
      <h3>⚠️</h3>
      <p style="text-align:center; color:var(--text2); margin-bottom:20px; line-height:1.5;">${message}</p>
      <div style="display:flex; gap:10px;">
        <button class="nav-btn secondary" style="flex:1" id="modal-no">${t('no')}</button>
        <button class="nav-btn" style="flex:1; background:var(--red)" id="modal-yes">${t('yes')}</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  document.getElementById('modal-yes').onclick = () => { overlay.remove(); onConfirm(); };
  document.getElementById('modal-no').onclick = () => overlay.remove();
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
};
