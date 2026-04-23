/**
 * ajrat.js — FINAL (RASMLI)
 * 
 * 3 ta max txt → pdd_max.json
 * 3 ta trash txt → pdd_trash.json
 * 
 * Rasmlar pdd_savollar_barchasi.json dan olinadi
 * 
 * Ishlatish: node ajrat.js
 */

const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, 'Ajratilgan');

// ========== NORMALIZE ==========
function norm(t) {
  return (t || '').toLowerCase().replace(/\r/g, '').replace(/[«»""''`.,;:!?\(\)\[\]{}\/\\\-–—]/g, '').replace(/\s+/g, ' ').trim();
}

// ========== RASM LOOKUP ==========
console.log('Rasmlar yuklanmoqda...');
const allQ = JSON.parse(fs.readFileSync(path.join(__dirname, 'public', 'pdd_savollar_barchasi.json'), 'utf8'));

// UZB savol → rasm
const rasmByUzb = new Map();
// KRIL savol → rasm
const rasmByKril = new Map();
// RUS savol → rasm
const rasmByRus = new Map();

for (const q of allQ) {
  if (q.rasm && q.rasm.trim()) {
    if (q.savol) rasmByUzb.set(norm(q.savol), q.rasm);
    if (q.savol_kril) rasmByKril.set(norm(q.savol_kril), q.rasm);
    if (q.savol_rus) rasmByRus.set(norm(q.savol_rus), q.rasm);
  }
}
console.log(`  Rasmli savollar: ${rasmByUzb.size} ta\n`);

// Rasm topish (aniq + prefix match)
function findRasm(savol, map) {
  const n = norm(savol);
  if (map.has(n)) return map.get(n);
  if (n.length > 15) {
    const prefix = n.substring(0, 35);
    for (const [key, val] of map) {
      if (key.startsWith(prefix)) return val;
    }
  }
  return '';
}

// ========== TXT PARSER ==========
function parseTxt(filePath, rasmMap) {
  const text = fs.readFileSync(filePath, 'utf8');
  const blocks = text.split(/\n\n+/).filter(b => b.trim());
  const result = [];
  let id = 0;
  let rasmCount = 0;

  for (const block of blocks) {
    const lines = block.trim().split('\n').filter(l => l.trim());
    const qLine = lines.find(l => l.startsWith('#'));
    if (!qLine) continue;
    const opts = lines.filter(l => l.startsWith('+') || l.startsWith('-'));
    if (!opts.length) continue;
    const ci = opts.findIndex(l => l.startsWith('+'));
    const savol = qLine.replace(/^#\s*/, '').trim();
    const rasm = findRasm(savol, rasmMap);
    if (rasm) rasmCount++;

    id++;
    result.push({
      id,
      bilet_id: Math.floor((id - 1) / 20) + 1,
      savol,
      javob_1: opts[0] ? opts[0].replace(/^[+-]\s*/, '').trim() : '',
      javob_2: opts[1] ? opts[1].replace(/^[+-]\s*/, '').trim() : '',
      javob_3: opts[2] ? opts[2].replace(/^[+-]\s*/, '').trim() : '',
      javob_4: opts[3] ? opts[3].replace(/^[+-]\s*/, '').trim() : '',
      togri_javob_raqami: ci + 1,
      togri_javob: ci >= 0 ? opts[ci].replace(/^[+]\s*/, '').trim() : '',
      rasm
    });
  }
  console.log(`  ${path.basename(filePath)}: ${result.length} savol, ${rasmCount} rasm`);
  return result;
}

// ========== YUKLASH VA BIRLASHTIRISH ==========
console.log('MAX fayllar:');
const maxUzb  = parseTxt(path.join(DIR, 'prava__uzb_max.txt'), rasmByUzb);
const maxKril = parseTxt(path.join(DIR, 'prava__kril_max.txt'), rasmByKril);
const maxRus  = parseTxt(path.join(DIR, 'prava__rus_max.txt'), rasmByRus);

const pddMax = { uzb: maxUzb, kril: maxKril, rus: maxRus };

console.log('\nTRASH fayllar:');
const trashUzb  = parseTxt(path.join(DIR, 'prava__uzb_trash.txt'), rasmByUzb);
const trashKril = parseTxt(path.join(DIR, 'prava__kril_trash.txt'), rasmByKril);
const trashRus  = parseTxt(path.join(DIR, 'prava__rus_trash.txt'), rasmByRus);

const pddTrash = { uzb: trashUzb, kril: trashKril, rus: trashRus };

// ========== YOZISH ==========
const maxOut   = path.join(__dirname, 'public', 'pdd_max.json');
const trashOut = path.join(__dirname, 'public', 'pdd_trash.json');

fs.writeFileSync(maxOut, JSON.stringify(pddMax, null, 2), 'utf8');
fs.writeFileSync(trashOut, JSON.stringify(pddTrash, null, 2), 'utf8');

// ========== NATIJA ==========
const cntRasm = (arr) => arr.filter(q => q.rasm && q.rasm.trim()).length;

console.log('\n==========================================');
console.log('            ✅ NATIJA');
console.log('==========================================\n');
console.log('  📁 pdd_max.json:');
console.log(`     UZB  : ${maxUzb.length} savol, ${cntRasm(maxUzb)} rasm 🖼️`);
console.log(`     KRIL : ${maxKril.length} savol, ${cntRasm(maxKril)} rasm 🖼️`);
console.log(`     RUS  : ${maxRus.length} savol, ${cntRasm(maxRus)} rasm 🖼️`);
console.log('\n  📁 pdd_trash.json:');
console.log(`     UZB  : ${trashUzb.length} savol, ${cntRasm(trashUzb)} rasm 🖼️`);
console.log(`     KRIL : ${trashKril.length} savol, ${cntRasm(trashKril)} rasm 🖼️`);
console.log(`     RUS  : ${trashRus.length} savol, ${cntRasm(trashRus)} rasm 🖼️`);
console.log('\n==========================================');
console.log('  Rasmlar pdd_savollar_barchasi dan olindi ✅');
console.log('==========================================');
