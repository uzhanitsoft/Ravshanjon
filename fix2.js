const fs = require('fs');
let h = fs.readFileSync('public/index.html', 'utf-8');

// Fix all remaining garbled Cyrillic characters
// Checkmark ✅
h = h.replace(/\u0432\u045a\u0405/g, '&#x2705;');
// Cross ❌  
h = h.replace(/\u0432\u045d\u040a/g, '&#x274C;');

fs.writeFileSync('public/index.html', h, 'utf-8');
console.log('Fixed remaining garbled characters');
