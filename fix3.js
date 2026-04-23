const fs = require('fs');
let h = fs.readFileSync('public/index.html', 'utf-8');
const lines = h.split('\n');

for (let i = 0; i < lines.length; i++) {
  // Line 885: fix "вњ… To'g'ri:" to "&#x2705; To'g'ri:" and "вќЊ Xato:" to "&#x274C; Xato:"  
  // Line 999: fix "вњ… To'g'ri javob!" and "вќЊ Xato!"
  
  // Match any 2+ char Cyrillic sequence followed by a space and recognizable text
  if (lines[i].includes("To'g'ri") && lines[i].includes('score.correct')) {
    // This is line 885 - result overlay
    lines[i] = lines[i].replace(/[^\x00-\x7F]+\s*To'g'ri:/g, "&#x2705; To'g'ri:");
    lines[i] = lines[i].replace(/[^\x00-\x7F]+\s*Xato:/g, "&#x274C; Xato:");
  }
  
  if (lines[i].includes("ans.correct") && lines[i].includes("To'g'ri javob")) {
    // This is line 999 - answer feedback
    lines[i] = lines[i].replace(/[^\x00-\x7F]+\s*To\\'g\\'ri javob!/g, "&#x2705; To'g'ri javob!");
    lines[i] = lines[i].replace(/[^\x00-\x7F]+\s*Xato!/g, "&#x274C; Xato!");
  }
}

fs.writeFileSync('public/index.html', lines.join('\n'), 'utf-8');
console.log('Fixed lines 885 and 999');
