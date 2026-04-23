/**
 * aqlli_solishtir.js
 * 
 * 3 ta MAX faylni (uzb/kril/rus) AQLLI moslashtiradi:
 * - Pozitsiya emas, savol STRUKTURASI bo'yicha: (variant_soni + to'g'ri_javob_indeksi)
 * - Bir xil strukturali savollar → mos (tarjima bo'lishi kerak)
 * - Moslanmagan → farq fayllariga
 * 
 * Ishlatish: node aqlli_solishtir.js
 */

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
    if (opts.length === 0) continue;

    const ci = opts.findIndex(l => l.startsWith('+'));
    const correctText = ci >= 0 ? opts[ci].replace(/^[+]\s*/, '').trim() : '';
    const allOptsText = opts.map(o => o.replace(/^[+-]\s*/, '').trim());

    blocks.push({
      raw: block.trim(),
      q: qLine.replace(/^#\s*/, '').trim(),
      opts: allOptsText,
      n: opts.length,
      ci,
      correct: correctText,
      // Qo'shimcha signal: to'g'ri javob uzunligi + barcha javoblar uzunligi
      correctLen: correctText.length,
      totalLen: allOptsText.join('').length,
      // Asosiy kalit: (variant soni) + (to'g'ri javob indeksi)
      fp: `${opts.length}_${ci}`
    });
  }
  return blocks;
}

// ========== LOAD ==========
console.log('Fayllar yuklanmoqda...\n');
const files = {
  uzb:  parseBlocks(path.join(DIR, 'prava__uzb_max.txt')),
  kril: parseBlocks(path.join(DIR, 'prava__kril_max.txt')),
  rus:  parseBlocks(path.join(DIR, 'prava__rus_max.txt')),
};
Object.entries(files).forEach(([k, v]) => console.log(`  ${k}_max: ${v.length} ta savol`));

// ========== SMART MATCHING ALGORITHM ==========
// Har bir savol uchun FP guruhi qurish
function buildFpMap(blocks) {
  const map = new Map();
  blocks.forEach((b, i) => {
    if (!map.has(b.fp)) map.set(b.fp, []);
    map.get(b.fp).push(i);
  });
  return map;
}

const fpMaps = {
  uzb:  buildFpMap(files.uzb),
  kril: buildFpMap(files.kril),
  rus:  buildFpMap(files.rus),
};

// ========== MATCHING ==========
const matched = [];        // { uzbI, krilI, rusI }
const usedKril = new Set();
const usedRus  = new Set();

let uniqueMatch = 0;    // aniq moslik (1 ta nomzod)
let multiMatch  = 0;    // bir nechta nomzod (eng yaqin tanlanadi)
let noMatch     = 0;    // moslanmagan

for (let ui = 0; ui < files.uzb.length; ui++) {
  const u = files.uzb[ui];
  const fp = u.fp;

  // Bu FP uchun kril va rus nomzodlarini toping (ishlatilmaganlarni)
  const krilCandidates = (fpMaps.kril.get(fp) || []).filter(i => !usedKril.has(i));
  const rusCandidates  = (fpMaps.rus.get(fp)  || []).filter(i => !usedRus.has(i));

  if (krilCandidates.length === 0 || rusCandidates.length === 0) {
    // Hech qanday mos yo'q
    noMatch++;
    continue;
  }

  let bestKril, bestRus;

  if (krilCandidates.length === 1 && rusCandidates.length === 1) {
    // Aniq: bitta nomzod
    bestKril = krilCandidates[0];
    bestRus  = rusCandidates[0];
    uniqueMatch++;
  } else {
    // Ko'p nomzod → to'g'ri javob UZUNLIGI bo'yicha eng yaqinini topamiz
    // (PDD savollarida raqamlar ko'p: 30m, 50km, 3.5t — uzunlik yaxshi signal)
    multiMatch++;

    // Kril uchun eng yaqin
    bestKril = krilCandidates.reduce((best, i) => {
      const curr = files.kril[i];
      const prev = files.kril[best];
      const currScore = Math.abs(curr.correctLen - u.correctLen) + Math.abs(curr.totalLen - u.totalLen) * 0.3;
      const prevScore = Math.abs(prev.correctLen - u.correctLen) + Math.abs(prev.totalLen - u.totalLen) * 0.3;
      return currScore < prevScore ? i : best;
    }, krilCandidates[0]);

    // Rus uchun eng yaqin
    bestRus = rusCandidates.reduce((best, i) => {
      const curr = files.rus[i];
      const prev = files.rus[best];
      const currScore = Math.abs(curr.correctLen - u.correctLen) + Math.abs(curr.totalLen - u.totalLen) * 0.3;
      const prevScore = Math.abs(prev.correctLen - u.correctLen) + Math.abs(prev.totalLen - u.totalLen) * 0.3;
      return currScore < prevScore ? i : best;
    }, rusCandidates[0]);
  }

  usedKril.add(bestKril);
  usedRus.add(bestRus);
  matched.push({ uzbI: ui, krilI: bestKril, rusI: bestRus });
}

// Moslanmagan savollar (hech qanday mos topilmagan)
const unmatchedUzb  = [];
const unmatchedKril = [];
const unmatchedRus  = [];

for (let i = 0; i < files.uzb.length; i++) {
  if (!matched.find(m => m.uzbI === i)) unmatchedUzb.push(i);
}
for (let i = 0; i < files.kril.length; i++) {
  if (!usedKril.has(i)) unmatchedKril.push(i);
}
for (let i = 0; i < files.rus.length; i++) {
  if (!usedRus.has(i)) unmatchedRus.push(i);
}

// ========== NATIJA FAYLLARIGA YOZISH ==========
function writeRaw(filePath, indices, blocks) {
  const content = indices.map(i => blocks[i].raw).join('\n\n') + '\n';
  fs.writeFileSync(filePath, content, 'utf8');
}

// MOS fayllar: barcha moslashtirилган savollar
writeRaw(path.join(DIR, 'mos_uzb.txt'),  matched.map(m => m.uzbI),  files.uzb);
writeRaw(path.join(DIR, 'mos_kril.txt'), matched.map(m => m.krilI), files.kril);
writeRaw(path.join(DIR, 'mos_rus.txt'),  matched.map(m => m.rusI),  files.rus);

// FARQ fayllar: moslanmagan savollar
writeRaw(path.join(DIR, 'farq_uzb.txt'),  unmatchedUzb,  files.uzb);
writeRaw(path.join(DIR, 'farq_kril.txt'), unmatchedKril, files.kril);
writeRaw(path.join(DIR, 'farq_rus.txt'),  unmatchedRus,  files.rus);

// ========== KONSOLGA NATIJA ==========
console.log('\n========== AQLLI MOSLASHTIRISH NATIJASI ==========\n');
console.log(`  Jami uzb savollari      : ${files.uzb.length}`);
console.log(`  Jami kril savollari     : ${files.kril.length}`);
console.log(`  Jami rus savollari      : ${files.rus.length}`);
console.log('');
console.log(`  Aniq moslik (1 nomzod)  : ${uniqueMatch} ta`);
console.log(`  Ko'p nomzodli moslik    : ${multiMatch} ta`);
console.log(`  Mos topilmagan (uzb)    : ${noMatch} ta`);
console.log('');
console.log(`  ✅ MOS savollar         : ${matched.length} ta`);
console.log(`     mos_uzb.txt          : ${matched.length} ta savol`);
console.log(`     mos_kril.txt         : ${matched.length} ta savol`);
console.log(`     mos_rus.txt          : ${matched.length} ta savol`);
console.log('');
console.log(`  ❌ FARQLI savollar:`);
console.log(`     farq_uzb.txt         : ${unmatchedUzb.length} ta savol`);
console.log(`     farq_kril.txt        : ${unmatchedKril.length} ta savol`);
console.log(`     farq_rus.txt         : ${unmatchedRus.length} ta savol`);

// Dastlabki 5 ta moslashtirishni namunaviy ko'rsat
console.log('\n--- NAMUNAVIY MOSLIKlar (dastlabki 5) ---');
for (let i = 0; i < Math.min(5, matched.length); i++) {
  const m = matched[i];
  const u = files.uzb[m.uzbI];
  const k = files.kril[m.krilI];
  const r = files.rus[m.rusI];
  console.log(`\n  [${i+1}] FP=${u.fp}`);
  console.log(`    UZB : ${u.q.substring(0, 70)}`);
  console.log(`    KRIL: ${k.q.substring(0, 70)}`);
  console.log(`    RUS : ${r.q.substring(0, 70)}`);
  console.log(`    To'g'ri: uzb="${u.correct.substring(0,40)}" | kril="${k.correct.substring(0,40)}" | rus="${r.correct.substring(0,40)}"`);
}

console.log('\n✅ Fayllar Ajratilgan/ papkasiga saqlandi!');
