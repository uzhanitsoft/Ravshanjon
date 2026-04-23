/**
 * solishtir.js
 * MAX fayllarni (uzb/kril/rus) pozitsiya bo'yicha solishtiradi.
 * - To'g'ri javob raqami 3 tilda mos → "mos" savol
 * - Mos kelmasa → farq_uzb.txt, farq_kril.txt, farq_rus.txt ga yoziladi
 *
 * Ishlatish: node solishtir.js
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
    blocks.push({
      raw: block.trim(),   // asl matn (formati saqlanadi)
      q: qLine.replace(/^#\s*/, '').trim(),
      n: opts.length,
      ci                   // to'g'ri javob indeksi (0-based)
    });
  }
  return blocks;
}

// ========== LOAD ==========
console.log('Fayllar yuklanmoqda...');
const uzb = parseBlocks(path.join(DIR, 'prava__uzb_max.txt'));
const kril = parseBlocks(path.join(DIR, 'prava__kril_max.txt'));
const rus  = parseBlocks(path.join(DIR, 'prava__rus_max.txt'));

console.log(`  uzb_max : ${uzb.length} ta savol`);
console.log(`  kril_max: ${kril.length} ta savol`);
console.log(`  rus_max : ${rus.length} ta savol`);

// ========== SOLISHTIRISH ==========
const total = Math.min(uzb.length, kril.length, rus.length);
console.log(`\nSolishtirish: ${total} ta savol (minimal)`);

const mosUzb = [], mosKril = [], mosRus = [];     // mos savollar
const farqUzb = [], farqKril = [], farqRus = [];   // farqli savollar

let mosCount = 0;
let farqCount = 0;

for (let i = 0; i < total; i++) {
  const u = uzb[i];
  const k = kril[i];
  const r = rus[i];

  // To'g'ri javob raqami 3 tilda bir xilmi?
  const mos = (u.ci === k.ci) && (u.ci === r.ci) && (u.ci >= 0);

  if (mos) {
    mosUzb.push(u.raw);
    mosKril.push(k.raw);
    mosRus.push(r.raw);
    mosCount++;
  } else {
    farqUzb.push(u.raw);
    farqKril.push(k.raw);
    farqRus.push(r.raw);
    farqCount++;

    // Konsolga farq ko'rsatilsin (dastlabki 10 ta)
    if (farqCount <= 10) {
      console.log(`\n  [FARQ #${farqCount}] Savol ${i + 1}:`);
      console.log(`    UZB  (${u.ci + 1}-javob to'g'ri): ${u.q.substring(0, 70)}`);
      console.log(`    KRIL (${k.ci + 1}-javob to'g'ri): ${k.q.substring(0, 70)}`);
      console.log(`    RUS  (${r.ci + 1}-javob to'g'ri): ${r.q.substring(0, 70)}`);
    }
  }
}

// Extra savollar (uzun faylda ko'p bo'lsa)
const extraUzb  = uzb.slice(total);
const extraKril = kril.slice(total);
const extraRus  = rus.slice(total);

if (extraUzb.length || extraKril.length || extraRus.length) {
  console.log(`\n  Extra savollar (fayllar uzunligi farq qiladi):`);
  console.log(`    uzb: +${extraUzb.length}, kril: +${extraKril.length}, rus: +${extraRus.length}`);
  // Ularni ham farq fayliga qo'shamiz
  extraUzb.forEach(b  => farqUzb.push(b.raw));
  extraKril.forEach(b => farqKril.push(b.raw));
  extraRus.forEach(b  => farqRus.push(b.raw));
}

// ========== YOZISH ==========
function writeBlocks(filePath, blocks) {
  fs.writeFileSync(filePath, blocks.join('\n\n') + '\n', 'utf8');
}

// Mos savollar → mos_uzb.txt, mos_kril.txt, mos_rus.txt
writeBlocks(path.join(DIR, 'mos_uzb.txt'),  mosUzb);
writeBlocks(path.join(DIR, 'mos_kril.txt'), mosKril);
writeBlocks(path.join(DIR, 'mos_rus.txt'),  mosRus);

// Farq savollar → farq_uzb.txt, farq_kril.txt, farq_rus.txt
writeBlocks(path.join(DIR, 'farq_uzb.txt'),  farqUzb);
writeBlocks(path.join(DIR, 'farq_kril.txt'), farqKril);
writeBlocks(path.join(DIR, 'farq_rus.txt'),  farqRus);

// ========== NATIJA ==========
console.log('\n========== NATIJA ==========');
console.log(`  Jami tekshirildi : ${total} ta savol`);
console.log(`  Mos (bir xil)    : ${mosCount} ta → mos_uzb/kril/rus.txt`);
console.log(`  Farqli           : ${farqCount + extraUzb.length} ta → farq_uzb/kril/rus.txt`);
console.log(`\n  Yaratilgan fayllar (Ajratilgan/ papkasida):`);
console.log(`    mos_uzb.txt  (${mosUzb.length} ta savol)`);
console.log(`    mos_kril.txt (${mosKril.length} ta savol)`);
console.log(`    mos_rus.txt  (${mosRus.length} ta savol)`);
console.log(`    farq_uzb.txt  (${farqUzb.length} ta savol)`);
console.log(`    farq_kril.txt (${farqKril.length} ta savol)`);
console.log(`    farq_rus.txt  (${farqRus.length} ta savol)`);
console.log('\n✅ Tayyor!');
