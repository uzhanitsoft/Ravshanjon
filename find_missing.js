const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, 'pdd-app', 'public', 'pdd_savollar_barchasi.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Qisman tarjima qilingan javoblardan lotin so'zlarni yig'ish
const wordCount = {};

for (const q of data) {
  for (const key of ['javob_1_rus', 'javob_2_rus', 'javob_3_rus', 'javob_4_rus']) {
    const val = q[key];
    if (!val || !/[a-zA-Z]/.test(val)) continue;
    
    // Lotin so'zlarni ajratish
    const latinWords = val.match(/[a-zA-Z'ʻ]+(?:\s+[a-zA-Z'ʻ]+)*/g);
    if (latinWords) {
      for (const w of latinWords) {
        const clean = w.trim().toLowerCase();
        if (clean.length > 1) {
          wordCount[clean] = (wordCount[clean] || 0) + 1;
        }
      }
    }
  }
}

// Eng ko'p uchraydiganlarni tartiblash
const sorted = Object.entries(wordCount).sort((a, b) => b[1] - a[1]);
console.log('Top 80 tarjima qilinmagan so\'zlar:\n');
sorted.slice(0, 80).forEach(([word, count], i) => {
  console.log(`${(i+1).toString().padStart(3)}. ${word.padEnd(35)} (${count} marta)`);
});
