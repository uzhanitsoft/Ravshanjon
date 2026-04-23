// ========= EXAM MODE =========

App.startExam = function() {
  if (this.questions.length < EXAM_QUESTIONS) {
    showToast(`${t('totalQuestions')}: ${this.questions.length} < ${EXAM_QUESTIONS}`, 'warn');
    return;
  }

  // Shuffle and pick random questions
  const shuffled = [...this.questions].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, EXAM_QUESTIONS);

  this.exam = {
    questions: selected.map(q => q.id),
    answers: {},
    timeRemaining: EXAM_DURATION,
    startedAt: Date.now(),
    currentQuestion: 0,
    finished: false
  };

  this.progress.activeExam = this.exam;
  this.save();

  this.screen = 'exam';
  this.render();
  this.startExamTimer();
};

App.startExamTimer = function() {
  if (this.examTimer) clearInterval(this.examTimer);

  this.examTimer = setInterval(() => {
    if (!this.exam || this.exam.finished) {
      clearInterval(this.examTimer);
      return;
    }
    this.exam.timeRemaining--;
    this.progress.activeExam = this.exam;

    // Update timer display
    const timerEl = document.getElementById('exam-timer-display');
    if (timerEl) {
      const m = Math.floor(this.exam.timeRemaining / 60);
      const s = this.exam.timeRemaining % 60;
      timerEl.textContent = `${m}:${s.toString().padStart(2, '0')}`;
      
      const wrapper = timerEl.closest('.exam-timer');
      if (wrapper) {
        wrapper.classList.remove('warning', 'danger');
        if (this.exam.timeRemaining <= 60) wrapper.classList.add('danger');
        else if (this.exam.timeRemaining <= 300) wrapper.classList.add('warning');
      }
    }

    if (this.exam.timeRemaining <= 0) {
      this.finishExam(true);
    }

    // Save every 10 seconds
    if (this.exam.timeRemaining % 10 === 0) this.save();
  }, 1000);
};

App.renderExamScreen = function() {
  if (!this.exam) return '';
  const qIds = this.exam.questions;
  const qi = this.exam.currentQuestion;
  const qId = qIds[qi];
  const q = this.questions.find(x => x.id === qId);
  if (!q) return '<div>Error: question not found</div>';

  const ans = this.exam.answers[qId];
  const qAnswers = this.getAnswers(q);
  const correctIdx = q.togri_javob_raqami;
  const letters = ['A','B','C','D'];
  const m = Math.floor((this.exam.timeRemaining || 0) / 60);
  const s = (this.exam.timeRemaining || 0) % 60;

  let timerClass = 'exam-timer';
  if (this.exam.timeRemaining <= 60) timerClass += ' danger';
  else if (this.exam.timeRemaining <= 300) timerClass += ' warning';

  let html = `
    <div class="q-view-header">
      <button class="q-back-btn" id="btn-exam-exit">✕ ${t('back')}</button>
      <div class="${timerClass}">
        <span>⏱️</span>
        <span id="exam-timer-display">${m}:${s.toString().padStart(2, '0')}</span>
      </div>
      <div class="q-counter">${qi + 1}/${qIds.length}</div>
    </div>

    <div class="progress-bar"><div class="progress-fill" style="width:${((qi + 1) / qIds.length * 100)}%"></div></div>

    <div class="q-dots">`;

  for (let i = 0; i < qIds.length; i++) {
    const a = this.exam.answers[qIds[i]];
    let cls = 'q-dot';
    if (i === qi) cls += ' current';
    else if (a) cls += a.correct ? ' correct' : ' wrong';
    html += `<div class="${cls}" data-eqi="${i}">${i + 1}</div>`;
  }
  html += '</div>';

  // Question
  const qText = getQuestionText(q);
  html += `<div class="question-card" style="animation:slideLeft 0.3s ease">`;
  html += `<div class="q-text">${this.esc(qText)}</div>`;

  if (q.rasm) {
    html += `<img class="q-image" src="${q.rasm}" alt="" onerror="this.style.display='none'" loading="lazy">`;
  }

  html += '<div class="answers">';
  
  if (this.exam.finished) {
    // Show correct/wrong after exam ends
    qAnswers.forEach((a, idx) => {
      let cls = 'answer-btn disabled';
      if (a.idx === correctIdx) cls += ' correct';
      else if (ans && a.idx === ans.selected && !ans.correct) cls += ' wrong';
      html += `<button class="${cls}">
        <span class="letter">${letters[idx] || ''}</span>
        <span>${this.esc(a.text)}</span>
      </button>`;
    });
  } else {
    qAnswers.forEach((a, idx) => {
      let cls = 'answer-btn';
      if (ans && a.idx === ans.selected) cls += ' selected-temp';
      html += `<button class="${cls}" data-eans="${a.idx}">
        <span class="letter">${letters[idx] || ''}</span>
        <span>${this.esc(a.text)}</span>
      </button>`;
    });
  }
  html += '</div>';

  // Navigation
  html += '<div class="nav-bar">';
  html += `<button class="nav-btn secondary" id="btn-eprev" ${qi === 0 ? 'disabled' : ''}>← ${t('prev')}</button>`;
  
  if (this.exam.finished) {
    html += `<button class="nav-btn" id="btn-enext">${qi < qIds.length - 1 ? t('next') + ' →' : t('close')}</button>`;
  } else {
    const answeredCount = Object.keys(this.exam.answers).length;
    if (qi >= qIds.length - 1 && answeredCount >= qIds.length) {
      html += `<button class="nav-btn green" id="btn-efinish">🏁 ${t('finish')}</button>`;
    } else {
      html += `<button class="nav-btn" id="btn-enext">${t('next')} →</button>`;
    }
  }
  html += '</div></div>';

  return html;
};

App.bindExamEvents = function() {
  const self = this;

  document.getElementById('btn-exam-exit')?.addEventListener('click', () => {
    if (self.exam && !self.exam.finished) {
      self.showConfirmModal(t('cancelConfirm'), () => {
        clearInterval(self.examTimer);
        self.exam = null;
        self.progress.activeExam = null;
        self.save();
        self.screen = 'home';
        self.render();
      });
    } else {
      self.exam = null;
      self.screen = 'home';
      self.render();
    }
  });

  document.querySelectorAll('.q-dot').forEach(dot => {
    dot.addEventListener('click', function() {
      self.exam.currentQuestion = parseInt(this.dataset.eqi);
      self.render();
    });
  });

  if (!this.exam.finished) {
    document.querySelectorAll('.answer-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const ansIdx = parseInt(this.dataset.eans);
        self.selectExamAnswer(ansIdx);
      });
    });
  }

  document.getElementById('btn-eprev')?.addEventListener('click', () => {
    if (self.exam.currentQuestion > 0) {
      self.exam.currentQuestion--;
      self.render();
    }
  });

  document.getElementById('btn-enext')?.addEventListener('click', () => {
    if (self.exam.finished && self.exam.currentQuestion >= self.exam.questions.length - 1) {
      self.exam = null;
      self.screen = 'home';
      self.render();
      return;
    }
    if (self.exam.currentQuestion < self.exam.questions.length - 1) {
      self.exam.currentQuestion++;
      self.render();
    }
  });

  document.getElementById('btn-efinish')?.addEventListener('click', () => {
    self.finishExam(false);
  });
};

App.selectExamAnswer = function(ansIdx) {
  if (!this.exam || this.exam.finished) return;
  const qId = this.exam.questions[this.exam.currentQuestion];
  const q = this.questions.find(x => x.id === qId);
  if (!q) return;

  this.exam.answers[qId] = {
    selected: ansIdx,
    correct: ansIdx === q.togri_javob_raqami
  };
  this.progress.activeExam = this.exam;
  this.save();
  this.render();
};

App.finishExam = function(timeUp) {
  if (!this.exam) return;
  clearInterval(this.examTimer);
  this.exam.finished = true;
  this.exam.finishedAt = Date.now();

  const total = this.exam.questions.length;
  const answered = Object.keys(this.exam.answers).length;
  const correct = Object.values(this.exam.answers).filter(a => a.correct).length;
  const wrong = answered - correct;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

  // Save to history
  if (!this.progress.examHistory) this.progress.examHistory = [];
  this.progress.examHistory.push({
    startedAt: this.exam.startedAt,
    finishedAt: this.exam.finishedAt,
    correct, wrong, total, pct, timeUp,
    timeUsed: EXAM_DURATION - (this.exam.timeRemaining || 0)
  });
  this.progress.activeExam = null;
  this.save();

  const emoji = pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪';
  const msg = timeUp ? t('examTimeUp') : (pct >= 80 ? t('excellent') : pct >= 50 ? t('good') : t('tryAgain'));
  const passText = pct >= 70 ? t('passed') : t('failed');
  const passColor = pct >= 70 ? 'var(--green)' : 'var(--red)';

  const overlay = document.createElement('div');
  overlay.className = 'result-overlay';
  overlay.innerHTML = `
    <div class="result-card">
      <div class="emoji">${emoji}</div>
      <h2>${t('examFinished')}</h2>
      <p class="result-desc">${msg}</p>
      <div class="score" style="color:${passColor}">${pct}%<span> (${correct}/${total})</span></div>
      <div style="font-size:16px; font-weight:700; color:${passColor}; margin-top:8px">${passText}</div>
      <div class="score-details">
        <span>✅ ${t('correct')}: ${correct}</span>
        <span>❌ ${t('wrong')}: ${wrong}</span>
      </div>
      <div style="display:flex;gap:10px;margin-top:24px;">
        <button class="nav-btn secondary" style="flex:1" id="exam-review">${t('reviewErrors')}</button>
        <button class="nav-btn" style="flex:1" id="exam-close">${t('close')}</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  document.getElementById('exam-close').onclick = () => {
    overlay.remove();
    this.exam = null;
    this.screen = 'home';
    this.render();
  };
  document.getElementById('exam-review').onclick = () => {
    overlay.remove();
    // Stay on exam screen in review mode
    this.exam.currentQuestion = 0;
    this.render();
  };
};
