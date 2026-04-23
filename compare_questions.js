const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'ajratilgan');

function parseQuestions(filePath) {
  const text = fs.readFileSync(filePath, 'utf-8');
  const blocks = text.split(/\n\n+/).filter(b => b.trim());
  const questions = [];
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    const qLine = lines.find(l => l.startsWith('#'));
    if (qLine) {
      // Normalize: remove #, trim, lowercase
      const q = qLine.replace(/^#\s*/, '').trim().toLowerCase().replace(/\s+/g, ' ');
      questions.push(q);
    }
  }
  return questions;
}

function compareFiles(file1, file2) {
  const q1 = parseQuestions(file1);
  const q2 = parseQuestions(file2);
  const set1 = new Set(q1);
  const set2 = new Set(q2);
  const common = q1.filter(q => set2.has(q));
  return {
    file1Name: path.basename(file1),
    file2Name: path.basename(file2),
    count1: q1.length,
    count2: q2.length,
    unique1: new Set(q1).size,
    unique2: new Set(q2).size,
    commonCount: new Set(common).size,
    percent1: ((new Set(common).size / new Set(q1).size) * 100).toFixed(1),
    percent2: ((new Set(common).size / new Set(q2).size) * 100).toFixed(1),
  };
}

// Files
const maxFiles = [
  path.join(dir, 'prava__uzb_max.txt'),
  path.join(dir, 'prava__kril_max.txt'),
  path.join(dir, 'prava__rus_max.txt'),
];
const trashFiles = [
  path.join(dir, 'prava__uzb_trash.txt'),
  path.join(dir, 'prava__kril_trash.txt'),
  path.join(dir, 'prava__rus_trash.txt'),
];

console.log('='.repeat(70));
console.log('  MAX FAYLLAR SOLISHTIRUVI (3 ta max faylni bir-biri bilan)');
console.log('='.repeat(70));

for (let i = 0; i < maxFiles.length; i++) {
  for (let j = i + 1; j < maxFiles.length; j++) {
    const r = compareFiles(maxFiles[i], maxFiles[j]);
    console.log(`\n  ${r.file1Name} vs ${r.file2Name}`);
    console.log(`  ${r.file1Name}: ${r.unique1} ta savol`);
    console.log(`  ${r.file2Name}: ${r.unique2} ta savol`);
    console.log(`  Mos kelgan: ${r.commonCount} ta`);
    console.log(`  ${r.file1Name} ning ${r.percent1}% | ${r.file2Name} ning ${r.percent2}%`);
  }
}

console.log('\n' + '='.repeat(70));
console.log('  TRASH FAYLLAR SOLISHTIRUVI (3 ta trash faylni bir-biri bilan)');
console.log('='.repeat(70));

for (let i = 0; i < trashFiles.length; i++) {
  for (let j = i + 1; j < trashFiles.length; j++) {
    const r = compareFiles(trashFiles[i], trashFiles[j]);
    console.log(`\n  ${r.file1Name} vs ${r.file2Name}`);
    console.log(`  ${r.file1Name}: ${r.unique1} ta savol`);
    console.log(`  ${r.file2Name}: ${r.unique2} ta savol`);
    console.log(`  Mos kelgan: ${r.commonCount} ta`);
    console.log(`  ${r.file1Name} ning ${r.percent1}% | ${r.file2Name} ning ${r.percent2}%`);
  }
}

// Summary
console.log('\n' + '='.repeat(70));
console.log('  UMUMIY STATISTIKA');
console.log('='.repeat(70));
for (const f of [...maxFiles, ...trashFiles]) {
  const q = parseQuestions(f);
  const u = new Set(q);
  console.log(`  ${path.basename(f).padEnd(25)} | Jami: ${q.length.toString().padStart(4)} | Noyob: ${u.size.toString().padStart(4)} | Duplikat: ${(q.length - u.size).toString().padStart(3)}`);
}
