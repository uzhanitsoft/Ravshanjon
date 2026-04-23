const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'ajratilgan');

function parseBlocks(filePath) {
  const text = fs.readFileSync(filePath, 'utf-8');
  const raw = text.split(/\n\n+/).filter(b => b.trim());
  const blocks = [];
  for (const block of raw) {
    const lines = block.trim().split('\n').filter(l => l.trim());
    const qLine = lines.find(l => l.startsWith('#'));
    if (!qLine) continue;
    const opts = lines.filter(l => l.startsWith('+') || l.startsWith('-'));
    const ci = opts.findIndex(l => l.startsWith('+'));
    blocks.push({
      raw: block.trim(),
      text: qLine.replace(/^#\s*/, '').trim(),
      totalOpts: opts.length,
      correctIdx: ci,
      fp: opts.length + '_' + ci
    });
  }
  return blocks;
}

// Parse
const uzb = parseBlocks(path.join(dir, 'prava__uzb_max.txt'));
const kril = parseBlocks(path.join(dir, 'prava__kril_max.txt'));
const rus = parseBlocks(path.join(dir, 'prava__rus_max.txt'));

console.log('OLDIN:');
console.log('  UZB:  ' + uzb.length + ' ta savol');
console.log('  KRIL: ' + kril.length + ' ta savol');
console.log('  RUS:  ' + rus.length + ' ta savol');

// LCS alignment
function lcsAlign(a, b) {
  const m = a.length, n = b.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1].fp === b[j-1].fp
        ? dp[i-1][j-1] + 1
        : Math.max(dp[i-1][j], dp[i][j-1]);

  const matchA = new Set(), matchB = new Set(), pairs = [];
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (a[i-1].fp === b[j-1].fp) {
      matchA.add(i-1); matchB.add(j-1);
      pairs.unshift([i-1, j-1]);
      i--; j--;
    } else if (dp[i-1][j] > dp[i][j-1]) i--;
    else j--;
  }
  return { pairs, matchA, matchB };
}

// Step 1: Align UZB vs RUS
const { pairs: uzbRusPairs, matchA: uzbMatched, matchB: rusMatched } = lcsAlign(uzb, rus);

// Step 2: From UZB matched indices, check KRIL (UZB and KRIL are same order)
// Find which UZB-KRIL pairs also have matching KRIL fingerprint
const commonPairs = []; // [uzbIdx, krilIdx, rusIdx]
const uzbKeep = new Set(), krilKeep = new Set(), rusKeep = new Set();

for (const [ui, ri] of uzbRusPairs) {
  // KRIL should be at same index as UZB (they're 1:1)
  if (ui < kril.length && kril[ui].fp === uzb[ui].fp) {
    commonPairs.push([ui, ui, ri]);
    uzbKeep.add(ui);
    krilKeep.add(ui);
    rusKeep.add(ri);
  }
}

console.log('\nUMUMIY MOS SAVOLLAR: ' + commonPairs.length + ' ta');

// Collect FARQ (different) questions
const farqUzb = [];
for (let i = 0; i < uzb.length; i++) {
  if (!uzbKeep.has(i)) farqUzb.push(uzb[i]);
}
const farqKril = [];
for (let i = 0; i < kril.length; i++) {
  if (!krilKeep.has(i)) farqKril.push(kril[i]);
}
const farqRus = [];
for (let i = 0; i < rus.length; i++) {
  if (!rusKeep.has(i)) farqRus.push(rus[i]);
}

// Write CLEANED files (only common questions)
const cleanUzb = commonPairs.map(([u,k,r]) => uzb[u].raw);
const cleanKril = commonPairs.map(([u,k,r]) => kril[k].raw);
const cleanRus = commonPairs.map(([u,k,r]) => rus[r].raw);

fs.writeFileSync(path.join(dir, 'prava__uzb_max.txt'), '\n' + cleanUzb.join('\n\n\n') + '\n', 'utf-8');
fs.writeFileSync(path.join(dir, 'prava__kril_max.txt'), '\n' + cleanKril.join('\n\n\n') + '\n', 'utf-8');
fs.writeFileSync(path.join(dir, 'prava__rus_max.txt'), '\n' + cleanRus.join('\n\n\n') + '\n', 'utf-8');

// Write FARQ files
fs.writeFileSync(path.join(dir, 'farq_uzb.txt'), farqUzb.length ? farqUzb.map(q => q.raw).join('\n\n\n') + '\n' : '(bo\'sh)\n', 'utf-8');
fs.writeFileSync(path.join(dir, 'farq_kril.txt'), farqKril.length ? farqKril.map(q => q.raw).join('\n\n\n') + '\n' : '(bo\'sh)\n', 'utf-8');
fs.writeFileSync(path.join(dir, 'farq_rus.txt'), farqRus.length ? farqRus.map(q => q.raw).join('\n\n\n') + '\n' : '(bo\'sh)\n', 'utf-8');

// Report
console.log('\n' + '='.repeat(60));
console.log('  NATIJA');
console.log('='.repeat(60));

console.log('\n  TOZALANGAN FAYLLAR (faqat umumiy savollar):');
console.log('  ✅ prava__uzb_max.txt  — ' + cleanUzb.length + ' ta');
console.log('  ✅ prava__kril_max.txt — ' + cleanKril.length + ' ta');
console.log('  ✅ prava__rus_max.txt  — ' + cleanRus.length + ' ta');

console.log('\n  FARQ FAYLLAR (faqat o\'sha tilda bor savollar):');
console.log('  📄 farq_uzb.txt  — ' + farqUzb.length + ' ta savol');
console.log('  📄 farq_kril.txt — ' + farqKril.length + ' ta savol');
console.log('  📄 farq_rus.txt  — ' + farqRus.length + ' ta savol');

if (farqUzb.length > 0) {
  console.log('\n  FAQAT UZB da bo\'lgan savollar:');
  farqUzb.forEach((q, i) => console.log('    ' + (i+1) + '. ' + q.text.substring(0, 90)));
}
if (farqKril.length > 0) {
  console.log('\n  FAQAT KRIL da bo\'lgan savollar:');
  farqKril.forEach((q, i) => console.log('    ' + (i+1) + '. ' + q.text.substring(0, 90)));
}
if (farqRus.length > 0) {
  console.log('\n  FAQAT RUS da bo\'lgan savollar:');
  farqRus.forEach((q, i) => console.log('    ' + (i+1) + '. ' + q.text.substring(0, 90)));
}

console.log('\nTAYYOR!');
