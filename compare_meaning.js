const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'ajratilgan');

function parseQuestionsDetailed(filePath) {
  const text = fs.readFileSync(filePath, 'utf-8');
  const blocks = text.split(/\n\n+/).filter(b => b.trim());
  const questions = [];
  for (const block of blocks) {
    const lines = block.trim().split('\n').filter(l => l.trim());
    const qLine = lines.find(l => l.startsWith('#'));
    if (!qLine) continue;
    
    const options = lines.filter(l => l.startsWith('+') || l.startsWith('-'));
    const correctIndex = options.findIndex(l => l.startsWith('+'));
    const totalOptions = options.length;
    
    // Create a "fingerprint" based on structure
    questions.push({
      questionText: qLine.replace(/^#\s*/, '').trim(),
      totalOptions,
      correctIndex,
      // Also store first few chars of each option for deeper matching
      optionLengths: options.map(o => o.length),
      fingerprint: `${totalOptions}_${correctIndex}`
    });
  }
  return questions;
}

function compareByMeaning(file1, file2) {
  const q1 = parseQuestionsDetailed(file1);
  const q2 = parseQuestionsDetailed(file2);
  
  // Compare by position (same index = same question in translation)
  const minLen = Math.min(q1.length, q2.length);
  let exactStructMatch = 0; // same options count + same correct index
  let positionMatches = [];
  let mismatches = [];
  
  for (let i = 0; i < minLen; i++) {
    if (q1[i].totalOptions === q2[i].totalOptions && 
        q1[i].correctIndex === q2[i].correctIndex) {
      exactStructMatch++;
      positionMatches.push(i);
    } else {
      mismatches.push({
        pos: i + 1,
        f1: `${q1[i].totalOptions} variant, to'g'ri: ${q1[i].correctIndex + 1}`,
        f2: `${q2[i].totalOptions} variant, to'g'ri: ${q2[i].correctIndex + 1}`,
        q1text: q1[i].questionText.substring(0, 60),
        q2text: q2[i].questionText.substring(0, 60)
      });
    }
  }
  
  return {
    file1Name: path.basename(file1),
    file2Name: path.basename(file2),
    count1: q1.length,
    count2: q2.length,
    comparedCount: minLen,
    structMatch: exactStructMatch,
    structPercent: ((exactStructMatch / minLen) * 100).toFixed(1),
    extraInFile1: q1.length > q2.length ? q1.length - q2.length : 0,
    extraInFile2: q2.length > q1.length ? q2.length - q1.length : 0,
    mismatchCount: mismatches.length,
    mismatches: mismatches.slice(0, 10) // Show first 10 mismatches
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

// Count questions
console.log('='.repeat(70));
console.log('  SAVOL SONLARI');
console.log('='.repeat(70));
for (const f of [...maxFiles, ...trashFiles]) {
  const q = parseQuestionsDetailed(f);
  console.log(`  ${path.basename(f).padEnd(25)} | ${q.length} ta savol`);
}

console.log('\n' + '='.repeat(70));
console.log('  MAX FAYLLAR — MA\'NO BO\'YICHA SOLISHTIRISH');
console.log('  (Pozitsiya + javob tuzilishi: variantlar soni + to\'g\'ri javob indeksi)');
console.log('='.repeat(70));

for (let i = 0; i < maxFiles.length; i++) {
  for (let j = i + 1; j < maxFiles.length; j++) {
    const r = compareByMeaning(maxFiles[i], maxFiles[j]);
    console.log(`\n  >> ${r.file1Name} vs ${r.file2Name}`);
    console.log(`     ${r.file1Name}: ${r.count1} ta savol`);
    console.log(`     ${r.file2Name}: ${r.count2} ta savol`);
    console.log(`     Solishtirildi: ${r.comparedCount} ta`);
    console.log(`     ✅ MA'NOSI MOS: ${r.structMatch} ta (${r.structPercent}%)`);
    console.log(`     ❌ FARQLI: ${r.mismatchCount} ta`);
    if (r.extraInFile1 > 0) console.log(`     ➕ ${r.file1Name} da qo'shimcha: ${r.extraInFile1} ta`);
    if (r.extraInFile2 > 0) console.log(`     ➕ ${r.file2Name} da qo'shimcha: ${r.extraInFile2} ta`);
    if (r.mismatches.length > 0) {
      console.log(`\n     Farqli savollar (birinchi ${r.mismatches.length} ta):`);
      for (const m of r.mismatches) {
        console.log(`       #${m.pos}: [${m.f1}] vs [${m.f2}]`);
        console.log(`         F1: ${m.q1text}...`);
        console.log(`         F2: ${m.q2text}...`);
      }
    }
  }
}

console.log('\n' + '='.repeat(70));
console.log('  TRASH FAYLLAR — MA\'NO BO\'YICHA SOLISHTIRISH');
console.log('='.repeat(70));

for (let i = 0; i < trashFiles.length; i++) {
  for (let j = i + 1; j < trashFiles.length; j++) {
    const r = compareByMeaning(trashFiles[i], trashFiles[j]);
    console.log(`\n  >> ${r.file1Name} vs ${r.file2Name}`);
    console.log(`     ${r.file1Name}: ${r.count1} ta savol`);
    console.log(`     ${r.file2Name}: ${r.count2} ta savol`);
    console.log(`     Solishtirildi: ${r.comparedCount} ta`);
    console.log(`     ✅ MA'NOSI MOS: ${r.structMatch} ta (${r.structPercent}%)`);
    console.log(`     ❌ FARQLI: ${r.mismatchCount} ta`);
    if (r.extraInFile1 > 0) console.log(`     ➕ ${r.file1Name} da qo'shimcha: ${r.extraInFile1} ta`);
    if (r.extraInFile2 > 0) console.log(`     ➕ ${r.file2Name} da qo'shimcha: ${r.extraInFile2} ta`);
    if (r.mismatches.length > 0) {
      console.log(`\n     Farqli savollar (birinchi ${Math.min(r.mismatches.length, 5)} ta):`);
      for (const m of r.mismatches.slice(0, 5)) {
        console.log(`       #${m.pos}: [${m.f1}] vs [${m.f2}]`);
        console.log(`         F1: ${m.q1text}...`);
        console.log(`         F2: ${m.q2text}...`);
      }
    }
  }
}

console.log('\n' + '='.repeat(70));
console.log('  UMUMIY XULOSA');
console.log('='.repeat(70));
