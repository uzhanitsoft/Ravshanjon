const fs = require('fs');
const path = 'public/index.html';
let html = fs.readFileSync(path, 'utf-8');

// Buzilgan belgilarni HTML entity bilan almashtirish
const replacements = [
  // Test mode buttons
  [/\u0440\u0434\u0437\u0432\u0402 Test/g, '&#x1F9EA; Test'],
  [/\u0440\u0434\u0437"\u0451 Ro'yxat/g, '&#x1F4C3; Ro\'yxat'],
  [/\u0440\u0434\u0437"\u0403 Fayl yuklash/g, '&#x1F4C1; Fayl yuklash'],
  [/\u0440\u0434\u0437"\u0403 Fayl/g, '&#x1F4C1; Fayl'],
  [/\u0440\u0434\u0437"\u040D/g, '&#x1F50D;'],
  // Navigation
  [/\u0432\u2020\u0452 Oldingi/g, '&#x2190; Oldingi'],
  [/Keyingi \u0432\u2020\u2019/g, 'Keyingi &#x2192;'],
  [/\u0440\u0434\u0437\u0417\u0403 Yakunlash/g, '&#x1F3C1; Yakunlash'],
  // Move button
  [/\u0432\u2020\u2014 /g, '&#x2197; '],
  // Bilet separator
  [/\u0432\u0402\u0459/g, '&#x2022;'],
  // Score emojis - find the const emoji line
  [/\u0440\u0434\u0437\u0426\u0438\u2030/g, '&#x1F389;'],
  [/\u0440\u0434\u0437\u0409/g, '&#x1F44D;'],
];

// Universal approach: replace by line content patterns
const lines = html.split('\n');
for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  
  // Fix garbled characters using byte patterns
  // Test button
  if (line.includes('Test</button>') && line.includes('mode-btn') && !line.includes('&#x')) {
    line = line.replace(/>[^<]*Test<\/button>/, '>&#x1F9EA; Test</button>');
  }
  // Ro'yxat button
  if (line.includes("Ro'yxat</button>") && line.includes('mode-btn') && !line.includes('&#x')) {
    line = line.replace(/>[^<]*Ro'yxat<\/button>/, ">&#x1F4C3; Ro'yxat</button>");
  }
  // Fayl yuklash button
  if (line.includes('Fayl yuklash</button>') && line.includes('mode-btn') && !line.includes('&#x')) {
    line = line.replace(/>[^<]*Fayl yuklash<\/button>/, '>&#x1F4C1; Fayl yuklash</button>');
  }
  // Fayl button (short)
  if (line.includes('Fayl</button>') && line.includes('mode-btn') && line.includes('file-input3') && !line.includes('&#x')) {
    line = line.replace(/>[^<]*Fayl<\/button>/, '>&#x1F4C1; Fayl</button>');
  }
  // Search placeholder
  if (line.includes('Qidirish...') && line.includes('search-input') && !line.includes('&#x')) {
    line = line.replace(/placeholder="[^"]*Qidirish\.\.\."/, 'placeholder="&#x1F50D; Qidirish..."');
  }
  // Oldingi button
  if (line.includes('Oldingi</button>') && line.includes('nav-btn') && !line.includes('&#x')) {
    line = line.replace(/>[^<]*Oldingi<\/button>/, '>&#x2190; Oldingi</button>');
  }
  // Keyingi / Yakunlash
  if (line.includes('Keyingi') && line.includes('Yakunlash') && !line.includes('&#x')) {
    line = line.replace(/Keyingi [^\s']*/, 'Keyingi &#x2192;');
    line = line.replace(/[^\s']*Yakunlash/, '&#x1F3C1; Yakunlash');
  }
  // Move button
  if (line.includes("ko'chirish</button>") && line.includes('q-move-btn') && !line.includes('&#x')) {
    line = line.replace(/>[^<]*\$\{otherTab\} ko'chirish/, '>&#x2197; ${otherTab} ko\'chirish');
  }
  // Bilet bullet
  if (line.includes('q-bilet') && line.includes('bilet_id') && !line.includes('&#x2022;')) {
    line = line.replace(/[^\s#]*\s*ID:/, '&#x2022; ID:');
  }
  // Empty state icon (search)
  if (line.includes('<div class="icon">') && line.includes('</div>') && !line.includes('&#x') && !line.includes('1F697')) {
    const iconMatch = line.match(/<div class="icon">([^<]*)<\/div>/);
    if (iconMatch && iconMatch[1].length < 10 && !iconMatch[1].includes('&#')) {
      line = line.replace(/<div class="icon">[^<]*<\/div>/, '<div class="icon">&#x1F50D;</div>');
    }
  }
  // Score emoji line
  if (line.includes('const emoji = pct') && !line.includes('&#x')) {
    line = "  const emoji = pct >= 80 ? '&#x1F389;' : pct >= 50 ? '&#x1F44D;' : '&#x1F4AA;';";
  }
  
  lines[i] = line;
}

html = lines.join('\n');
fs.writeFileSync(path, html, 'utf-8');
console.log('Barcha yozuvlar to\'g\'rilandi!');
