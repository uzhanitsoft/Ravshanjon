const fs = require('fs'); 
const content = fs.readFileSync('C:/Users/shoxr/.gemini/antigravity/brain/13fb14f6-3944-4be4-8e9c-473dc00e2a5e/.system_generated/steps/1245/content.md', 'utf8'); 

console.log('RPC calls:', content.match(/\.rpc\(['"][a-zA-Z0-9_]+['"]\)/g));
console.log('API routes:', content.match(/\/api\/[a-zA-Z0-9_\/]+/g));
console.log('Supabase tables:', content.match(/\.from\(['"][a-zA-Z0-9_]+['"]\)/g));
