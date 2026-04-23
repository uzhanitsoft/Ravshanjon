// ========= BILET SCREEN =========

App.openBilet = function(biletIdx) {
  this.currentBilet = biletIdx;
  // Restore question position
  const answers = this.progress.biletAnswers?.[biletIdx] || {};
  const bilet = this.bilets[biletIdx];
  if (!bilet) return;

  // Find first unanswered
  let startQ = 0;
  for (let i = 0; i < bilet.length; i++) {
    if (!answers[bilet[i].id]) { startQ = i; break; }
    if (i === bilet.length - 1) startQ = 0; // all answered, start from beginning
  }
  this.currentQuestion = startQ;
  this.screen = 'bilet';
  this.render();
};

App.renderBiletScreen = function() {
  const bilet = this.bilets[this.currentBilet];
  if (!bilet || !bilet.length) return '<div>Error</div>';

  const q = bilet[this.currentQuestion];
  const answers = this.progress.biletAnswers?.[this.currentBilet] || {};
  const ans = answers[q.id];
  const qAnswers = this.getAnswers(q);
  const correctIdx = q.togri_javob_raqami;
  const letters = ['A','B','C','D'];
  const pct = ((this.currentQuestion + 1) / bilet.length * 100);

  let html = `
    <div class="q-view-header">
      <button class="q-back-btn" id="btn-back-home">← ${t('back')}</button>
      <div class="q-counter">${t('ticket')} ${this.currentBilet + 1} · ${this.currentQuestion + 1}/${bilet.length}</div>
    </div>

    <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>

    <div class="q-dots">`;

  for (let i = 0; i < bilet.length; i++) {
    const qId = bilet[i].id;
    const a = answers[qId];
    let cls = 'q-dot';
    if (i === this.currentQuestion) cls += ' current';
    else if (a && a.correct) cls += ' correct';
    else if (a && !a.correct) cls += ' wrong';
    html += `<div class="${cls}" data-qi="${i}">${i + 1}</div>`;
  }
  html += '</div>';

  // Question card
  const qText = getQuestionText(q);
  html += `<div class="question-card" style="animation:slideLeft 0.3s ease">`;
  html += `<div class="q-text">${this.esc(qText)}</div>`;

  if (q.rasm) {
    html += `<img class="q-image" src="${q.rasm}" alt="" onerror="this.style.display='none'" loading="lazy">`;
  }

  html += '<div class="answers">';
  qAnswers.forEach((a, idx) => {
    let cls = 'answer-btn';
    if (ans) {
      if (a.idx === correctIdx) cls += ' correct';
      else if (a.idx === ans.selected && !ans.correct) cls += ' wrong';
      else if (!ans.correct && a.idx === correctIdx) cls += ' correct-highlight';
      cls += ' disabled';
    }
    html += `<button class="${cls}" data-ans="${a.idx}">
      <span class="letter">${letters[idx] || ''}</span>
      <span>${this.esc(a.text)}</span>
    </button>`;
  });
  html += '</div>';

  // Navigation
  const isLast = this.currentQuestion >= bilet.length - 1;
  const allAnswered = Object.keys(answers).length >= bilet.length;
  html += `<div class="nav-bar">`;
  html += `<button class="nav-btn secondary" id="btn-prev" ${this.currentQuestion === 0 ? 'disabled' : ''}>← ${t('prev')}</button>`;
  
  if (isLast && allAnswered) {
    html += `<button class="nav-btn green" id="btn-next">🏁 ${t('finish')}</button>`;
  } else {
    html += `<button class="nav-btn${ans ? ' green' : ''}" id="btn-next" ${!ans ? 'disabled' : ''}>${t('next')} →</button>`;
  }
  html += '</div></div>';

  return html;
};

App.bindBiletEvents = function() {
  const self = this;
  const bilet = this.bilets[this.currentBilet];

  document.getElementById('btn-back-home')?.addEventListener('click', () => {
    self.screen = 'home';
    self.render();
  });

  document.querySelectorAll('.q-dot').forEach(dot => {
    dot.addEventListener('click', function() {
      self.currentQuestion = parseInt(this.dataset.qi);
      self.render();
    });
  });

  document.querySelectorAll('.answer-btn:not(.disabled)').forEach(btn => {
    btn.addEventListener('click', function() {
      const ansIdx = parseInt(this.dataset.ans);
      self.selectBiletAnswer(ansIdx);
    });
  });

  document.getElementById('btn-prev')?.addEventListener('click', () => {
    if (self.currentQuestion > 0) { self.currentQuestion--; self.render(); }
  });

  document.getElementById('btn-next')?.addEventListener('click', () => {
    const answers = self.progress.biletAnswers?.[self.currentBilet] || {};
    const allAnswered = Object.keys(answers).length >= bilet.length;
    
    if (self.currentQuestion >= bilet.length - 1 && allAnswered) {
      self.showBiletResult();
    } else if (self.currentQuestion < bilet.length - 1) {
      self.currentQuestion++;
      self.render();
    }
  });
};

App.selectBiletAnswer = function(ansIdx) {
  const bilet = this.bilets[this.currentBilet];
  const q = bilet[this.currentQuestion];
  const isCorrect = ansIdx === q.togri_javob_raqami;

  if (!this.progress.biletAnswers[this.currentBilet]) {
    this.progress.biletAnswers[this.currentBilet] = {};
  }
  this.progress.biletAnswers[this.currentBilet][q.id] = {
    selected: ansIdx,
    correct: isCorrect
  };

  this.progress.currentBilet = this.currentBilet;
  this.progress.currentQuestion = this.currentQuestion;
  this.save();

  // Re-render with answer shown
  this.render();

  // Auto-advance after delay
  setTimeout(() => {
    const answers = this.progress.biletAnswers[this.currentBilet] || {};
    const allAnswered = Object.keys(answers).length >= bilet.length;
    if (this.currentQuestion < bilet.length - 1) {
      this.currentQuestion++;
      this.render();
    } else if (allAnswered) {
      this.showBiletResult();
    }
  }, 700);
};

App.showBiletResult = function() {
  const s = this.getBiletStatus(this.currentBilet);
  const pct = Math.round((s.correct / s.total) * 100);
  const emoji = pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪';
  const msg = pct >= 80 ? t('excellent') : pct >= 50 ? t('good') : t('tryAgain');

  // Save score
  this.progress.biletScores[this.currentBilet] = { correct: s.correct, wrong: s.wrong, total: s.total };
  this.save();

  const overlay = document.createElement('div');
  overlay.className = 'result-overlay';
  overlay.innerHTML = `
    <div class="result-card">
      <div class="emoji">${emoji}</div>
      <h2>${t('testFinished')}</h2>
      <p class="result-desc">${msg}</p>
      <div class="score">${pct}%<span> (${s.correct}/${s.total})</span></div>
      <div class="score-details">
        <span>✅ ${t('correct')}: ${s.correct}</span>
        <span>❌ ${t('wrong')}: ${s.wrong}</span>
      </div>
      <div style="display:flex;gap:10px;margin-top:24px;">
        <button class="nav-btn secondary" style="flex:1" id="result-retake">${t('retake')}</button>
        <button class="nav-btn" style="flex:1" id="result-close">${t('close')}</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  document.getElementById('result-close').onclick = () => {
    overlay.remove();
    this.screen = 'home';
    this.render();
  };
  document.getElementById('result-retake').onclick = () => {
    overlay.remove();
    // Reset this bilet
    delete this.progress.biletAnswers[this.currentBilet];
    delete this.progress.biletScores[this.currentBilet];
    this.save();
    this.currentQuestion = 0;
    this.render();
  };
};
