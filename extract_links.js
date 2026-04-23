const html = require('fs').readFileSync('avto_raw.html', 'utf8'); 
const matches = html.match(/src="[^"]+\.js"/g); 
console.log(matches ? matches.join('\n') : 'no scripts found');
