const fs = require('fs');
const h = fs.readFileSync('public/index.html', 'utf-8');
const lines = h.split('\n');

// Fix line 831: arrow in toast message
lines[830] = lines[830].replace(/[^\x00-\x7F]+\s*\$\{target\}ga/, "&#x2192; ${target}ga");

// Fix line 1053: otherTab arrows  
lines[1052] = "  const otherTab = state.currentTab === 'main' ? 'Istisnolarga' : 'Asosiyga';";

fs.writeFileSync('public/index.html', lines.join('\n'), 'utf-8');

// Verify
const result = fs.readFileSync('public/index.html', 'utf-8');
const remaining = result.split('\n').filter((l,i) => 
  /[^\x00-\x7E]/.test(l) && !l.trim().startsWith('//') && !l.includes('font')
);
console.log('Remaining issues:', remaining.length);
remaining.forEach((l,i) => console.log(' -', l.trim().substring(0,100)));
console.log('Done!');
