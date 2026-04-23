const fs = require('fs');
const path = require('path');

// O'zbek lotin → kirill transliteratsiya jadvali
function latinToCyrillic(text) {
  if (!text || text.trim() === '') return text;
  
  let result = text;
  
  // Ikki harfli kombinatsiyalar (avval almashtiriladi)
  const doubleMap = [
    // Katta harflar
    ['Sh', 'Ш'], ['SH', 'Ш'], ['sh', 'ш'],
    ['Ch', 'Ч'], ['CH', 'Ч'], ['ch', 'ч'],
    ['Ng', 'Нг'], ['NG', 'НГ'], ['ng', 'нг'],
    ["O'", 'Ў'], ["O\u2018", 'Ў'], ["o'", 'ў'], ["o\u2018", 'ў'],
    ["G'", 'Ғ'], ["G\u2018", 'Ғ'], ["g'", 'ғ'], ["g\u2018", 'ғ'],
    ["Yo", 'Ё'], ["YO", 'Ё'],
    ["Ya", 'Я'], ["YA", 'Я'],
    ["Yu", 'Ю'], ["YU", 'Ю'],
    ["Ye", 'Е'], ["YE", 'Е'],
    ["Ts", 'Ц'], ["TS", 'Ц'], ['ts', 'ц'],
  ];

  // Avval ikki harflilarni almashtir
  for (const [lat, cyr] of doubleMap) {
    result = result.split(lat).join(cyr);
  }

  // So'z boshidagi yo, ya, yu, ye
  // yo, ya, yu harflari so'z boshida yoki unli harfdan keyin kelganda
  result = result.replace(/\byo/g, 'ё');
  result = result.replace(/\bya/g, 'я');
  result = result.replace(/\byu/g, 'ю');
  result = result.replace(/\bye/g, 'е');
  
  // Unli harflardan keyingi yo, ya, yu
  result = result.replace(/([аеёиоуўэюяАЕЁИОУЎЭЮЯ])yo/g, '$1ё');
  result = result.replace(/([аеёиоуўэюяАЕЁИОУЎЭЮЯ])ya/g, '$1я');
  result = result.replace(/([аеёиоуўэюяАЕЁИОУЎЭЮЯ])yu/g, '$1ю');
  result = result.replace(/([аеёиоуўэюяАЕЁИОУЎЭЮЯ])ye/g, '$1е');

  // Bitta harfli almashtirishlar
  const singleMap = {
    'A': 'А', 'B': 'Б', 'D': 'Д', 'E': 'Э', 'F': 'Ф',
    'G': 'Г', 'H': 'Ҳ', 'I': 'И', 'J': 'Ж', 'K': 'К',
    'L': 'Л', 'M': 'М', 'N': 'Н', 'O': 'О', 'P': 'П',
    'Q': 'Қ', 'R': 'Р', 'S': 'С', 'T': 'Т', 'U': 'У',
    'V': 'В', 'X': 'Х', 'Y': 'Й', 'Z': 'З',
    'a': 'а', 'b': 'б', 'd': 'д', 'e': 'э', 'f': 'ф',
    'g': 'г', 'h': 'ҳ', 'i': 'и', 'j': 'ж', 'k': 'к',
    'l': 'л', 'm': 'м', 'n': 'н', 'o': 'о', 'p': 'п',
    'q': 'қ', 'r': 'р', 's': 'с', 't': 'т', 'u': 'у',
    'v': 'в', 'x': 'х', 'y': 'й', 'z': 'з',
  };

  let final = '';
  for (let i = 0; i < result.length; i++) {
    const ch = result[i];
    if (singleMap[ch]) {
      final += singleMap[ch];
    } else {
      final += ch;
    }
  }

  // E harfini to'g'rilash: so'z boshida va unli harfdan keyin E→Е, boshqa joylarda E→э
  // Aslida o'zbek kirill yozuvida 'e' ko'pincha 'е' bo'ladi
  final = final.replace(/\bЭ/g, 'Е');
  final = final.replace(/\bэ/g, 'е');
  // Unli harfdan keyingi э→е
  final = final.replace(/([аеёиоуўэюяАЕЁИОУЎЭЮЯ])э/g, '$1е');
  
  return final;
}

// Asosiy skript
const jsonPath = path.join(__dirname, 'pdd-app', 'public', 'pdd_savollar_barchasi.json');
const backupPath = path.join(__dirname, 'pdd-app', 'public', 'pdd_savollar_backup.json');

console.log('📖 Savollar bazasini o\'qish...');
const rawData = fs.readFileSync(jsonPath, 'utf8');
const questions = JSON.parse(rawData);

// Backup yaratish
fs.writeFileSync(backupPath, rawData, 'utf8');
console.log(`💾 Backup saqlandi: ${backupPath}`);

console.log(`📊 Jami savollar: ${questions.length}`);

let translatedCount = 0;

for (const q of questions) {
  // Javoblarni kirill yozuviga o'tkazish
  if (q.javob_1) q.javob_1_kril = latinToCyrillic(q.javob_1);
  if (q.javob_2) q.javob_2_kril = latinToCyrillic(q.javob_2);
  if (q.javob_3) q.javob_3_kril = latinToCyrillic(q.javob_3);
  if (q.javob_4) q.javob_4_kril = latinToCyrillic(q.javob_4);
  
  // To'g'ri javobni ham kirill yozuviga o'tkazish  
  if (q.togri_javob) q.togri_javob_kril = latinToCyrillic(q.togri_javob);
  
  translatedCount++;
}

// Natijani tekshirish — birinchi 3 savolni ko'rsatish
console.log('\n✅ Transliteratsiya namunalari:\n');
for (let i = 0; i < 3; i++) {
  const q = questions[i];
  console.log(`--- Savol ${q.id} ---`);
  console.log(`  Lotin:  ${q.javob_1}`);
  console.log(`  Kirill: ${q.javob_1_kril}`);
  if (q.javob_2) {
    console.log(`  Lotin:  ${q.javob_2}`);
    console.log(`  Kirill: ${q.javob_2_kril}`);
  }
  console.log('');
}

// Yangilangan JSONni saqlash
fs.writeFileSync(jsonPath, JSON.stringify(questions, null, 2), 'utf8');
console.log(`\n🎉 ${translatedCount} ta savolning javoblari kirill yozuviga o'tkazildi!`);
console.log(`📁 Saqlandi: ${jsonPath}`);
