// Скрипт: Добавляет кириллические ответы в JSON базу
// Транслитерация O'zbek Lotin → Ўзбек Кирилл
// Запуск: node add_kirill.js

const fs = require('fs');
const path = require('path');

const INPUT = path.join(__dirname, 'public', 'pdd_savollar_barchasi.json');
const OUTPUT = INPUT; // перезапишет тот же файл

// ====== ТАБЛИЦА ТРАНСЛИТЕРАЦИИ ======
// Порядок важен: сначала длинные комбинации, потом короткие

function latinToKirill(text) {
  if (!text || typeof text !== 'string') return text;

  // Если текст уже полностью на кириллице — вернуть как есть
  const latinChars = text.match(/[a-zA-Z]/g);
  if (!latinChars || latinChars.length === 0) return text;

  let result = text;

  // Шаг 1: Многобуквенные комбинации (порядок важен!)
  const digraphs = [
    // 3-буквенные
    ['Sh', 'Ш'], ['sh', 'ш'],
    ['Ch', 'Ч'], ['ch', 'ч'],
    ['SH', 'Ш'], ['CH', 'Ч'],
    // O' и G' — с апострофом
    ["O'", 'Ў'], ["o'", 'ў'],
    ["G'", 'Ғ'], ["g'", 'ғ'],
    ["O`", 'Ў'], ["o`", 'ў'],
    ["G`", 'Ғ'], ["g`", 'ғ'],
    ["O'", 'Ў'], ["o'", 'ў'],  // типографский апостроф
    ["G'", 'Ғ'], ["g'", 'ғ'],
    ["O\u2018", 'Ў'], ["o\u2018", 'ў'],
    ["G\u2018", 'Ғ'], ["g\u2018", 'ғ'],
    ["O\u02BB", 'Ў'], ["o\u02BB", 'ў'],
    ["G\u02BB", 'Ғ'], ["g\u02BB", 'ғ'],
  ];

  for (const [lat, kir] of digraphs) {
    result = result.split(lat).join(kir);
  }

  // Шаг 2: Начало слова — Yo, Yu, Ya, Ye
  result = result.replace(/\bYo/g, 'Ё');
  result = result.replace(/\byo/g, 'ё');
  result = result.replace(/\bYu/g, 'Ю');
  result = result.replace(/\byu/g, 'ю');
  result = result.replace(/\bYa/g, 'Я');
  result = result.replace(/\bya/g, 'я');
  result = result.replace(/\bYe/g, 'Е');
  result = result.replace(/\bye/g, 'е');

  // Шаг 3: Однобуквенные замены
  const singles = {
    'A': 'А', 'a': 'а',
    'B': 'Б', 'b': 'б',
    'D': 'Д', 'd': 'д',
    'E': 'Е', 'e': 'е',
    'F': 'Ф', 'f': 'ф',
    'G': 'Г', 'g': 'г',
    'H': 'Ҳ', 'h': 'ҳ',
    'I': 'И', 'i': 'и',
    'J': 'Ж', 'j': 'ж',
    'K': 'К', 'k': 'к',
    'L': 'Л', 'l': 'л',
    'M': 'М', 'm': 'м',
    'N': 'Н', 'n': 'н',
    'O': 'О', 'o': 'о',
    'P': 'П', 'p': 'п',
    'Q': 'Қ', 'q': 'қ',
    'R': 'Р', 'r': 'р',
    'S': 'С', 's': 'с',
    'T': 'Т', 't': 'т',
    'U': 'У', 'u': 'у',
    'V': 'В', 'v': 'в',
    'X': 'Х', 'x': 'х',
    'Y': 'Й', 'y': 'й',
    'Z': 'З', 'z': 'з',
  };

  let final = '';
  for (let i = 0; i < result.length; i++) {
    const ch = result[i];
    final += singles[ch] || ch;
  }

  // Убрать оставшиеся апострофы после ъ
  final = final.replace(/['`\u2018\u2019\u02BB]/g, 'ъ');
  // Но не двойные ъ
  final = final.replace(/ъъ/g, 'ъ');
  // Убрать ъ перед согласными в начале слова (ошибочные)
  // Не нужно — оставим как есть

  return final;
}

// ====== ГЛАВНАЯ ЛОГИКА ======
console.log('Читаю JSON файл...');
const raw = fs.readFileSync(INPUT, 'utf-8');
const data = JSON.parse(raw);

console.log(`Найдено ${data.length} вопросов`);
console.log('Добавляю кириллические ответы...');

let converted = 0;

for (const q of data) {
  // Ответы на кириллице
  if (q.javob_1) q.javob_1_kril = latinToKirill(q.javob_1);
  if (q.javob_2) q.javob_2_kril = latinToKirill(q.javob_2);
  if (q.javob_3) q.javob_3_kril = latinToKirill(q.javob_3);
  if (q.javob_4) q.javob_4_kril = latinToKirill(q.javob_4);

  // Правильный ответ на кириллице
  if (q.togri_javob) q.togri_javob_kril = latinToKirill(q.togri_javob);

  // Пустые поля — пустые строки
  if (!q.javob_1_kril) q.javob_1_kril = '';
  if (!q.javob_2_kril) q.javob_2_kril = '';
  if (!q.javob_3_kril) q.javob_3_kril = '';
  if (!q.javob_4_kril) q.javob_4_kril = '';
  if (!q.togri_javob_kril) q.togri_javob_kril = '';

  converted++;
}

console.log(`Обработано: ${converted} вопросов`);
console.log('Записываю файл...');

fs.writeFileSync(OUTPUT, JSON.stringify(data, null, 2), 'utf-8');

console.log('');
console.log('========================================');
console.log(`  ГОТОВО! Файл обновлён: ${OUTPUT}`);
console.log(`  ${converted} вопросов × 5 полей = ${converted * 5} переводов`);
console.log('========================================');
