/**
 * tarjima_solishtir.js
 * 
 * 1. RUS savollarni Google Translate orqali UZB ga tarjima qiladi
 * 2. Tarjimani asl UZB savollari bilan matn bo'yicha solishtiradi
 * 3. Mos / farqli savollarni ajratadi
 * 
 * Ishlatish:
 *   npm install google-translate-api-x
 *   node tarjima_solishtir.js
 */

const translate = require('google-translate-api-x');
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, 'Ajratilgan');

// ========== PARSER ==========
function parseBlocks(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const raw = text.split(/\n\n+/).filter(b => b.trim());
  const blocks = [];
  for (const block of raw) {
    const lines = block.trim().split('\n').filter(l => l.trim());
    const qLine = lines.find(l => l.startsWith('#'));
    if (!qLine) continue;
    const opts = lines.filter(l => l.startsWith('+') || l.startsWith('-'));
    if (!opts.length) continue;
    const ci = opts.findIndex(l => l.startsWith('+'));
    blocks.push({
      raw: block.trim(),
      q: qLine.replace(/^#\s*/, '').trim(),
      n: opts.length,
      ci,
      correct: ci >= 0 ? opts[ci].replace(/^[+]\s*/, '').trim() : '',
      fp: `${opts.length}_${ci}`
    });
  }
  return blocks;
}

// ========== MATN O'XSHASHLIGI ==========
// Ikki matnni solishtirish (normalized)
function normalize(text) {
  return text.toLowerCase()
    .replace(/[«»""''`\-–—.,;:!?\(\)\[\]{}\/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Bigram similarity (Dice coefficient)
function bigrams(str) {
  const s = new Set();
  for (let i = 0; i < str.length - 1; i++) {
    s.add(str.substring(i, i + 2));
  }
  return s;
}

function similarity(a, b) {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1.0;
  if (!na || !nb) return 0;

  const ba = bigrams(na);
  const bb = bigrams(nb);
  let intersection = 0;
  for (const bg of ba) {
    if (bb.has(bg)) intersection++;
  }
  return (2 * intersection) / (ba.size + bb.size);
}

// ========== LOAD ==========
console.log('Fayllar yuklanmoqda...');
const uzb  = parseBlocks(path.join(DIR, 'prava__uzb_max.txt'));
const kril = parseBlocks(path.join(DIR, 'prava__kril_max.txt'));
const rus  = parseBlocks(path.join(DIR, 'prava__rus_max.txt'));
console.log(`  uzb: ${uzb.length} | kril: ${kril.length} | rus: ${rus.length}\n`);

// ========== PROGRESS ==========
const progressFile = path.join(DIR, '.tarjima_progress.json');
let progressData = { translations: {}, matches: {} };
if (fs.existsSync(progressFile)) {
  progressData = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
  console.log(`  ⏩ Progress topildi: ${Object.keys(progressData.translations).length} ta tarjima\n`);
}

function saveProgress() {
  fs.writeFileSync(progressFile, JSON.stringify(progressData), 'utf8');
}

// ========== 1-BOSQICH: TARJIMA ==========
async function translateAll() {
  console.log('=== 1-BOSQICH: RUS → UZB tarjima ===\n');
  const total = rus.length;
  let newCount = 0;

  for (let i = 0; i < total; i++) {
    if (progressData.translations[i]) {
      if (i % 50 === 0) console.log(`  [${i+1}/${total}] keshdan...`);
      continue;
    }

    const r = rus[i];
    // Savol + to'g'ri javobni tarjima qilamiz
    const textToTranslate = r.q + ' ||| ' + r.correct;

    try {
      const result = await translate(textToTranslate, { from: 'ru', to: 'uz' });
      const parts = result.text.split('|||');
      progressData.translations[i] = {
        q: (parts[0] || '').trim(),
        correct: (parts[1] || '').trim()
      };
      newCount++;

      if (newCount % 5 === 0 || i < 3) {
        console.log(`  [${i+1}/${total}] "${r.q.substring(0,40)}" → "${progressData.translations[i].q.substring(0,40)}"`);
      }
    } catch (e) {
      console.error(`  [${i+1}] Xato: ${e.message?.substring(0, 60)}`);
      // Rate limit bo'lsa kutamiz
      if (e.message?.includes('429') || e.message?.includes('Too Many')) {
        console.log('  ⏳ Rate limit, 10 soniya kutamiz...');
        await new Promise(r => setTimeout(r, 10000));
        i--; // qayta urinish
        continue;
      }
      progressData.translations[i] = { q: '', correct: '' };
    }

    // Har 5 tadan saqlash
    if (newCount % 5 === 0) saveProgress();

    // Rate limit oldini olish: 500ms kutish
    if (newCount > 0) await new Promise(r => setTimeout(r, 500));
  }

  saveProgress();
  console.log(`\n  ✅ Tarjima tugadi: ${newCount} ta yangi, ${total - newCount} ta keshdan\n`);
}

// ========== 2-BOSQICH: MOSLASHTIRISH ==========
function matchAll() {
  console.log('=== 2-BOSQICH: MOSLASHTIRISH ===\n');

  const usedUzb = new Set();
  const matched = []; // { rusI, uzbI, krilI, score }
  const unmatchedRus = [];

  for (let ri = 0; ri < rus.length; ri++) {
    const r = rus[ri];
    const tr = progressData.translations[ri];
    if (!tr || !tr.q) {
      unmatchedRus.push(ri);
      continue;
    }

    // Nomzodlar: bir xil FP (variant soni + to'g'ri javob indeksi)
    let bestScore = 0;
    let bestUzbI = -1;

    for (let ui = 0; ui < uzb.length; ui++) {
      if (usedUzb.has(ui)) continue;
      if (uzb[ui].fp !== r.fp) continue; // Struktura mos bo'lishi kerak

      // Savol o'xshashligi
      const qScore = similarity(tr.q, uzb[ui].q);
      // To'g'ri javob o'xshashligi
      const aScore = similarity(tr.correct, uzb[ui].correct);
      // Umumiy ball
      const total = qScore * 0.6 + aScore * 0.4;

      if (total > bestScore) {
        bestScore = total;
        bestUzbI = ui;
      }
    }

    if (bestUzbI >= 0 && bestScore >= 0.5) {
      usedUzb.add(bestUzbI);
      matched.push({ rusI: ri, uzbI: bestUzbI, score: bestScore });

      if (ri < 5 || ri % 30 === 0) {
        console.log(`  [${ri+1}] ✅ ${bestScore.toFixed(2)} | "${uzb[bestUzbI].q.substring(0,45)}" ↔ "${r.q.substring(0,45)}"`);
      }
    } else {
      unmatchedRus.push(ri);
    }
  }

  // Kril moslik: UZB bilan bir xil pozitsiyada (UZB=KRIL alifbo farq)
  // Lekin kril fayllar ham boshqa tartibda bo'lishi mumkin, shuning uchun FP+similarity
  const usedKril = new Set();
  for (const m of matched) {
    const u = uzb[m.uzbI];
    let bestKril = -1, bestKScore = 0;
    for (let ki = 0; ki < kril.length; ki++) {
      if (usedKril.has(ki)) continue;
      if (kril[ki].fp !== u.fp) continue;
      // Kril va UZB o'rtasida raqamlar va so'z uzunligi solishtirish
      const lenRatio = Math.min(u.q.length, kril[ki].q.length) / Math.max(u.q.length, kril[ki].q.length);
      const correctLenRatio = Math.min(u.correct.length, kril[ki].correct.length) / Math.max(u.correct.length, kril[ki].correct.length);
      const score = lenRatio * 0.5 + correctLenRatio * 0.5;
      if (score > bestKScore) { bestKScore = score; bestKril = ki; }
    }
    if (bestKril >= 0) {
      usedKril.add(bestKril);
      m.krilI = bestKril;
    }
  }

  return { matched, unmatchedRus, usedUzb, usedKril };
}

// ========== 3-BOSQICH: FAYLLAR YOZISH ==========
function writeResults(result) {
  console.log('\n=== 3-BOSQICH: FAYLLAR YOZISH ===\n');

  const { matched, unmatchedRus, usedUzb, usedKril } = result;
  const write = (fp, blocks) => fs.writeFileSync(fp, blocks.join('\n\n') + '\n', 'utf8');

  // MOS fayllar
  const mosU = matched.map(m => uzb[m.uzbI].raw);
  const mosK = matched.filter(m => m.krilI !== undefined).map(m => kril[m.krilI].raw);
  const mosR = matched.map(m => rus[m.rusI].raw);
  write(path.join(DIR, 'mos_uzb.txt'), mosU);
  write(path.join(DIR, 'mos_kril.txt'), mosK);
  write(path.join(DIR, 'mos_rus.txt'), mosR);

  // FARQ fayllar
  const farqU = [];
  for (let i = 0; i < uzb.length; i++) {
    if (!usedUzb.has(i)) farqU.push(uzb[i].raw);
  }
  const farqK = [];
  for (let i = 0; i < kril.length; i++) {
    if (!usedKril.has(i)) farqK.push(kril[i].raw);
  }
  const farqR = unmatchedRus.map(i => rus[i].raw);
  write(path.join(DIR, 'farq_uzb.txt'), farqU);
  write(path.join(DIR, 'farq_kril.txt'), farqK);
  write(path.join(DIR, 'farq_rus.txt'), farqR);

  // Statistika
  const avgScore = matched.reduce((s, m) => s + m.score, 0) / matched.length;
  console.log('========== NATIJA ==========');
  console.log(`  ✅ MOS savollar    : ${matched.length} ta (o'rtacha ball: ${avgScore.toFixed(2)})`);
  console.log(`     mos_uzb.txt     : ${mosU.length}`);
  console.log(`     mos_kril.txt    : ${mosK.length}`);
  console.log(`     mos_rus.txt     : ${mosR.length}`);
  console.log('');
  console.log(`  ❌ FARQLI savollar:`);
  console.log(`     farq_uzb.txt    : ${farqU.length}`);
  console.log(`     farq_kril.txt   : ${farqK.length}`);
  console.log(`     farq_rus.txt    : ${farqR.length}`);

  // Eng past balllar (tekshirish uchun)
  const lowScores = matched.filter(m => m.score < 0.5).sort((a, b) => a.score - b.score);
  if (lowScores.length > 0) {
    console.log(`\n  ⚠️  Past ball (< 0.5): ${lowScores.length} ta — tekshirib ko'ring:`);
    lowScores.slice(0, 5).forEach(m => {
      console.log(`    ${m.score.toFixed(2)}: uzb="${uzb[m.uzbI].q.substring(0,50)}" ↔ rus="${rus[m.rusI].q.substring(0,50)}"`);
    });
  }

  console.log('\n✅ Tayyor! Fayllar Ajratilgan/ papkasida.');
}

// ========== MAIN ==========
async function main() {
  await translateAll();
  const result = matchAll();
  writeResults(result);

  // Progress faylini o'chirish
  // if (fs.existsSync(progressFile)) fs.unlinkSync(progressFile);
  console.log('\n💡 Progress fayl saqlanib qoldi (.tarjima_progress.json) — qayta tekshirish uchun');
}

main().catch(console.error);
