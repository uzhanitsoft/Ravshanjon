/**
 * PDD Dataset Comparator: max vs trash
 * 3 tilda (uzb, kril, rus) solishtiradi
 * Natijani compare_report.html ga yozadi
 */

const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, 'Ajratilgan');

// ============ PARSER ============
function parseFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const blocks = text.split(/\n\n+/).filter(b => b.trim());
  const questions = [];

  for (const block of blocks) {
    const lines = block.trim().split('\n').filter(l => l.trim());
    const qLine = lines.find(l => l.startsWith('#'));
    if (!qLine) continue;

    const opts = lines.filter(l => l.startsWith('+') || l.startsWith('-'));
    const correctIdx = opts.findIndex(l => l.startsWith('+'));
    const correctText = correctIdx >= 0 ? opts[correctIdx].replace(/^[+-]\s*/, '').trim() : '';

    questions.push({
      q: qLine.replace(/^#\s*/, '').trim(),
      opts: opts.map(o => o.replace(/^[+-]\s*/, '').trim()),
      n: opts.length,
      ci: correctIdx,
      correct: correctText,
      // fingerprint: question text normalized
      fp: qLine.replace(/^#\s*/, '').trim().toLowerCase().replace(/[^\w\s]/g,'').replace(/\s+/g,' ')
    });
  }
  return questions;
}

// ============ LOAD ALL FILES ============
console.log('Fayllar yuklanmoqda...');
const data = {};
const langs = ['uzb', 'kril', 'rus'];

for (const lang of langs) {
  const maxPath = path.join(DIR, `prava__${lang}_max.txt`);
  const trashPath = path.join(DIR, `prava__${lang}_trash.txt`);
  data[lang] = {
    max: parseFile(maxPath),
    trash: parseFile(trashPath)
  };
  console.log(`  ${lang}: max=${data[lang].max.length}, trash=${data[lang].trash.length}`);
}

// ============ ANALYSIS ============

// 1. Find duplicates inside max
function findInternalDuplicates(questions, label) {
  const seen = new Map();
  const dups = [];
  for (let i = 0; i < questions.length; i++) {
    const fp = questions[i].fp;
    if (seen.has(fp)) {
      dups.push({ i1: seen.get(fp), i2: i, q: questions[i].q });
    } else {
      seen.set(fp, i);
    }
  }
  return dups;
}

// 2. Find questions that appear in both max and trash
function findCrossMatches(maxQs, trashQs) {
  const trashFps = new Map();
  trashQs.forEach((q, i) => trashFps.set(q.fp, i));

  const matches = [];
  for (let i = 0; i < maxQs.length; i++) {
    if (trashFps.has(maxQs[i].fp)) {
      const j = trashFps.get(maxQs[i].fp);
      // Check if correct answer differs
      const answerMatch = maxQs[i].ci === trashQs[j].ci;
      matches.push({
        maxIdx: i, trashIdx: j,
        q: maxQs[i].q,
        maxCorrect: maxQs[i].correct,
        trashCorrect: trashQs[j].correct,
        answerMatch,
        maxN: maxQs[i].n,
        trashN: trashQs[j].n
      });
    }
  }
  return matches;
}

// 3. Find questions only in trash (not in max) — "missing from max"
function findTrashOnly(maxQs, trashQs) {
  const maxFps = new Set(maxQs.map(q => q.fp));
  return trashQs.filter((q, i) => !maxFps.has(q.fp)).map((q, i) => ({ q: q.q, correct: q.correct, n: q.n }));
}

// 4. Check consistency across languages (uzb max vs kril max vs rus max — same count?)
function checkLangConsistency() {
  const report = [];
  const uzbMax = data.uzb.max.length;
  const krilMax = data.kril.max.length;
  const rusMax = data.rus.max.length;
  const uzbTrash = data.uzb.trash.length;
  const krilTrash = data.kril.trash.length;
  const rusTrash = data.rus.trash.length;

  report.push({ label: 'MAX savollar', uzb: uzbMax, kril: krilMax, rus: rusMax });
  report.push({ label: 'TRASH savollar', uzb: uzbTrash, kril: krilTrash, rus: rusTrash });
  report.push({ label: 'JAMI', uzb: uzbMax + uzbTrash, kril: krilMax + krilTrash, rus: rusMax + rusTrash });
  return report;
}

// 5. Answer inconsistency check across languages (same question # in uzb max vs kril max)
function checkAnswerConsistency() {
  const issues = [];
  const minLen = Math.min(data.uzb.max.length, data.kril.max.length, data.rus.max.length);
  for (let i = 0; i < minLen; i++) {
    const uzbCi = data.uzb.max[i].ci;
    const krilCi = data.kril.max[i].ci;
    const rusCi = data.rus.max[i].ci;
    if (uzbCi !== krilCi || uzbCi !== rusCi) {
      issues.push({
        idx: i + 1,
        uzbQ: data.uzb.max[i].q.substring(0, 80),
        uzbCi, krilCi, rusCi,
        uzbAns: data.uzb.max[i].correct.substring(0, 60),
        krilAns: data.kril.max[i].correct.substring(0, 60),
        rusAns: data.rus.max[i].correct.substring(0, 60)
      });
    }
  }
  return issues;
}

// ============ RUN ALL ANALYSIS ============
console.log('\nTahlil bajarilmoqda...');

const results = {
  consistency: checkLangConsistency(),
  answerConsistency: checkAnswerConsistency(),
  dups: {
    uzb_max: findInternalDuplicates(data.uzb.max, 'uzb_max'),
    kril_max: findInternalDuplicates(data.kril.max, 'kril_max'),
    rus_max: findInternalDuplicates(data.rus.max, 'rus_max'),
    uzb_trash: findInternalDuplicates(data.uzb.trash, 'uzb_trash'),
    kril_trash: findInternalDuplicates(data.kril.trash, 'kril_trash'),
    rus_trash: findInternalDuplicates(data.rus.trash, 'rus_trash'),
  },
  crossMatches: {
    uzb: findCrossMatches(data.uzb.max, data.uzb.trash),
    kril: findCrossMatches(data.kril.max, data.kril.trash),
    rus: findCrossMatches(data.rus.max, data.rus.trash),
  },
  trashOnly: {
    uzb: findTrashOnly(data.uzb.max, data.uzb.trash),
    kril: findTrashOnly(data.kril.max, data.kril.trash),
    rus: findTrashOnly(data.rus.max, data.rus.trash),
  }
};

// ============ LOG SUMMARY ============
console.log('\n========== NATIJALAR ==========');
console.log('\n--- TIL BO\'YICHA STATISTIKA ---');
results.consistency.forEach(r => {
  console.log(`  ${r.label}: uzb=${r.uzb}, kril=${r.kril}, rus=${r.rus}`);
});

console.log('\n--- JAVOB NOMUVOFIQLIGI (3 til o\'rtasida) ---');
console.log(`  ${results.answerConsistency.length} ta savol (MAX) uchun til bo'yicha to'g'ri javob farq qiladi`);

console.log('\n--- ICHKI DUPLIKATLAR ---');
Object.entries(results.dups).forEach(([k, v]) => {
  console.log(`  ${k}: ${v.length} ta duplikat`);
});

console.log('\n--- MAX va TRASH O\'RTASIDA UMUMIY SAVOLLAR ---');
Object.entries(results.crossMatches).forEach(([lang, matches]) => {
  const conflict = matches.filter(m => !m.answerMatch);
  console.log(`  ${lang}: ${matches.length} ta umumiy savol (${conflict.length} tasida javob farq qiladi!)`);
});

console.log('\n--- FAQAT TRASH DA (MAX da yo\'q) ---');
Object.entries(results.trashOnly).forEach(([lang, qs]) => {
  console.log(`  ${lang}: ${qs.length} ta savol trash da bor, max da yo'q`);
});

// ============ HTML REPORT ============
function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function crossMatchTable(matches, lang) {
  if (!matches.length) return '<p style="color:green">Umumiy savollar yo\'q ✓</p>';
  const conflict = matches.filter(m => !m.answerMatch);
  let html = `<p><b>${matches.length}</b> ta savol ham MAX, ham TRASH da mavjud. `;
  if (conflict.length) html += `<span style="color:red"><b>${conflict.length}</b> tasida JAVOB FARQ QILADI!</span>`;
  else html += `<span style="color:green">Hammada to'g'ri javob mos ✓</span>`;
  html += '</p>';

  if (conflict.length > 0) {
    html += `<table><tr><th>#</th><th>Savol</th><th>MAX to'g'ri javob</th><th>TRASH to'g'ri javob</th></tr>`;
    conflict.slice(0, 50).forEach((m, i) => {
      html += `<tr class="conflict">
        <td>${i+1}</td>
        <td>${esc(m.q.substring(0,100))}</td>
        <td>${esc(m.maxCorrect.substring(0,80))}</td>
        <td>${esc(m.trashCorrect.substring(0,80))}</td>
      </tr>`;
    });
    if (conflict.length > 50) html += `<tr><td colspan="4">... va yana ${conflict.length-50} ta</td></tr>`;
    html += '</table>';
  }

  // Non-conflicting matches
  const ok = matches.filter(m => m.answerMatch);
  if (ok.length > 0) {
    html += `<details><summary>Javob mos bo'lgan ${ok.length} ta umumiy savol (bosing)</summary>`;
    html += `<table><tr><th>#</th><th>Savol</th><th>Variant soni</th></tr>`;
    ok.slice(0, 30).forEach((m, i) => {
      html += `<tr><td>${i+1}</td><td>${esc(m.q.substring(0,120))}</td><td>max:${m.maxN} / trash:${m.trashN}</td></tr>`;
    });
    if (ok.length > 30) html += `<tr><td colspan="3">... va yana ${ok.length-30} ta</td></tr>`;
    html += '</table></details>';
  }
  return html;
}

function answerConsistencyTable(issues) {
  if (!issues.length) return '<p style="color:green">Barcha 3 tilda to\'g\'ri javoblar mos ✓</p>';
  let html = `<p><span style="color:red"><b>${issues.length}</b> ta savolda 3 til bo'yicha to'g'ri javob farq qiladi!</span></p>`;
  html += `<table><tr><th>#</th><th>Savol (uzb)</th><th>uzb to'g'ri</th><th>kril to'g'ri</th><th>rus to'g'ri</th></tr>`;
  issues.slice(0, 100).forEach((iss, i) => {
    html += `<tr class="conflict">
      <td>${iss.idx}</td>
      <td>${esc(iss.uzbQ)}</td>
      <td>${esc(iss.uzbAns)} <small>(${iss.uzbCi+1})</small></td>
      <td>${esc(iss.krilAns)} <small>(${iss.krilCi+1})</small></td>
      <td>${esc(iss.rusAns)} <small>(${iss.rusCi+1})</small></td>
    </tr>`;
  });
  if (issues.length > 100) html += `<tr><td colspan="5">... va yana ${issues.length-100} ta</td></tr>`;
  html += '</table>';
  return html;
}

function dupTable(dups, qs) {
  if (!dups.length) return '<p style="color:green">Duplikatlar yo\'q ✓</p>';
  let html = `<p><span style="color:orange"><b>${dups.length}</b> ta duplikat topildi</span></p>`;
  html += '<table><tr><th>Savol #1</th><th>Savol #2</th><th>Matn</th></tr>';
  dups.forEach(d => {
    html += `<tr><td>${d.i1+1}</td><td>${d.i2+1}</td><td>${esc(d.q.substring(0,100))}</td></tr>`;
  });
  html += '</table>';
  return html;
}

const html = `<!DOCTYPE html>
<html lang="uz">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>PDD Dataset Tahlili — MAX vs TRASH</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Segoe UI', sans-serif; background:#0f1117; color:#e2e8f0; padding:20px; }
  h1 { font-size:28px; font-weight:800; margin-bottom:8px;
       background:linear-gradient(135deg,#818cf8,#6366f1); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
  h2 { font-size:20px; font-weight:700; margin:30px 0 12px; color:#c7d2fe; border-left:4px solid #6366f1; padding-left:10px; }
  h3 { font-size:16px; font-weight:700; margin:16px 0 8px; color:#a5b4fc; }
  .subtitle { color:#94a3b8; font-size:14px; margin-bottom:30px; }
  .stats-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:12px; margin-bottom:30px; }
  .stat-card { background:rgba(30,41,70,0.7); border:1px solid rgba(99,130,255,0.2); border-radius:12px; padding:16px; text-align:center; }
  .stat-card .num { font-size:32px; font-weight:800; color:#818cf8; }
  .stat-card .label { font-size:12px; color:#64748b; margin-top:4px; text-transform:uppercase; letter-spacing:0.5px; }
  .section { background:rgba(30,41,70,0.5); border:1px solid rgba(99,130,255,0.15); border-radius:16px; padding:20px; margin-bottom:20px; }
  table { width:100%; border-collapse:collapse; font-size:13px; margin-top:10px; }
  th { background:rgba(99,102,241,0.2); color:#c7d2fe; padding:8px 10px; text-align:left; border:1px solid rgba(99,130,255,0.2); }
  td { padding:7px 10px; border:1px solid rgba(99,130,255,0.15); vertical-align:top; color:#cbd5e1; }
  tr:hover td { background:rgba(99,102,241,0.06); }
  tr.conflict td { background:rgba(239,68,68,0.08); border-color:rgba(239,68,68,0.25); }
  .badge { display:inline-block; padding:2px 8px; border-radius:20px; font-size:11px; font-weight:700; }
  .badge.ok { background:rgba(34,197,94,0.15); color:#22c55e; border:1px solid rgba(34,197,94,0.3); }
  .badge.warn { background:rgba(234,179,8,0.15); color:#eab308; border:1px solid rgba(234,179,8,0.3); }
  .badge.err { background:rgba(239,68,68,0.15); color:#ef4444; border:1px solid rgba(239,68,68,0.3); }
  details summary { cursor:pointer; color:#818cf8; padding:6px 0; font-weight:600; }
  details summary:hover { color:#c7d2fe; }
  .lang-tabs { display:flex; gap:8px; margin-bottom:16px; flex-wrap:wrap; }
  .tag { padding:4px 12px; border-radius:20px; font-size:12px; font-weight:700;
         background:rgba(99,102,241,0.15); border:1px solid rgba(99,102,241,0.3); color:#818cf8; }
  p { color:#94a3b8; font-size:14px; margin:6px 0; line-height:1.6; }
</style>
</head>
<body>
<h1>📊 PDD Dataset Tahlili</h1>
<p class="subtitle">MAX vs TRASH — 3 tilda (O'zbek Lotin, O'zbek Kirill, Rus) solishtirish natijasi</p>

<!-- STATS OVERVIEW -->
<div class="stats-grid">
  <div class="stat-card"><div class="num">${results.consistency[0].uzb}</div><div class="label">UZB Max</div></div>
  <div class="stat-card"><div class="num">${results.consistency[1].uzb}</div><div class="label">UZB Trash</div></div>
  <div class="stat-card"><div class="num">${results.consistency[0].kril}</div><div class="label">KRIL Max</div></div>
  <div class="stat-card"><div class="num">${results.consistency[1].kril}</div><div class="label">KRIL Trash</div></div>
  <div class="stat-card"><div class="num">${results.consistency[0].rus}</div><div class="label">RUS Max</div></div>
  <div class="stat-card"><div class="num">${results.consistency[1].rus}</div><div class="label">RUS Trash</div></div>
</div>

<!-- LANG CONSISTENCY -->
<h2>1. Til bo'yicha statistika</h2>
<div class="section">
<table>
<tr><th>Ko'rsatkich</th><th>O'zbek (Lotin)</th><th>O'zbek (Kirill)</th><th>Rus</th><th>Holat</th></tr>
${results.consistency.map(r => {
  const ok = r.uzb === r.kril && r.kril === r.rus;
  return `<tr>
    <td><b>${esc(r.label)}</b></td>
    <td>${r.uzb}</td><td>${r.kril}</td><td>${r.rus}</td>
    <td><span class="badge ${ok?'ok':'err'}">${ok?'✓ Mos':'✗ Farqli'}</span></td>
  </tr>`;
}).join('')}
</table>
</div>

<!-- ANSWER CONSISTENCY ACROSS LANGS -->
<h2>2. 3 til bo'yicha to'g'ri javob muvofiqligi (MAX)</h2>
<div class="section">
${answerConsistencyTable(results.answerConsistency)}
</div>

<!-- CROSS MATCHES -->
<h2>3. MAX va TRASH da qayta uchraydigan savollar</h2>
${['uzb','kril','rus'].map(lang => `
<div class="section">
<h3>
  <span class="tag">${lang === 'uzb' ? "O'zbek Lotin" : lang === 'kril' ? 'O\'zbek Kirill' : 'Rus'}</span>
</h3>
${crossMatchTable(results.crossMatches[lang], lang)}
</div>`).join('')}

<!-- INTERNAL DUPLICATES -->
<h2>4. Ichki duplikatlar</h2>
${['uzb','kril','rus'].map(lang => `
<div class="section">
<h3><span class="tag">${lang}</span> — MAX</h3>
${dupTable(results.dups[lang+'_max'], data[lang].max)}
<h3><span class="tag">${lang}</span> — TRASH</h3>
${dupTable(results.dups[lang+'_trash'], data[lang].trash)}
</div>`).join('')}

<!-- TRASH ONLY -->
<h2>5. Faqat TRASH da bor (MAX da yo'q) savollar</h2>
${['uzb','kril','rus'].map(lang => {
  const qs = results.trashOnly[lang];
  return `
<div class="section">
<h3><span class="tag">${lang}</span> — ${qs.length} ta savol</h3>
${qs.length === 0 ? '<p style="color:green">Hammasi MAX da ham mavjud ✓</p>' : `
<details><summary>Ko'rish (${Math.min(qs.length,50)} ta)</summary>
<table><tr><th>#</th><th>Savol</th><th>To'g'ri javob</th><th>Variant soni</th></tr>
${qs.slice(0,50).map((q,i) => `<tr><td>${i+1}</td><td>${esc(q.q.substring(0,120))}</td><td>${esc(q.correct.substring(0,80))}</td><td>${q.n}</td></tr>`).join('')}
${qs.length > 50 ? `<tr><td colspan="4">... va yana ${qs.length-50} ta</td></tr>` : ''}
</table></details>`}
</div>`;
}).join('')}

<br>
<p style="color:#475569; font-size:12px; text-align:center">Tahlil: ${new Date().toLocaleString('uz-UZ')} | PDD Dataset Comparator v1.0</p>
</body>
</html>`;

const outPath = path.join(__dirname, 'Ajratilgan', 'compare_report.html');
fs.writeFileSync(outPath, html, 'utf8');
console.log(`\n✅ HTML hisobot saqlandi: ${outPath}`);
console.log('Brauzerda oching!');
