// AI Tarjima: UZ → RU (Google Translate orqali)
// Barcha javoblarni sifatli rus tiliga tarjima qiladi
// Ishlatish: node ai_translate.js

const fs = require('fs');
const path = require('path');

const INPUT = path.join(__dirname, 'pdd-app', 'public', 'pdd_savollar_barchasi.json');
const OUTPUT = INPUT;

// Google Translate (bepul, kalitsiz)
async function translateText(text, from = 'uz', to = 'ru') {
  if (!text || text.trim() === '') return '';

  // Agar matn allaqachon ruscha bo'lsa — qaytarish
  const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
  const totalAlpha = (text.match(/[a-zA-Zа-яА-ЯёЁ]/g) || []).length;
  if (totalAlpha > 0 && latinChars === 0) return text;

  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data && data[0]) {
      let translated = '';
      for (const segment of data[0]) {
        if (segment[0]) translated += segment[0];
      }
      return translated.trim();
    }
    return text;
  } catch (err) {
    console.error(`  Xatolik: "${text.substring(0, 40)}..." - ${err.message}`);
    return text;
  }
}

// Kutish (rate limit uchun)
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('JSON faylni o\'qiyapman...');
  const raw = fs.readFileSync(INPUT, 'utf-8');
  const data = JSON.parse(raw);
  console.log(`${data.length} ta savol topildi`);

  // 1-qadam: Barcha noyob javoblarni yig'ish
  console.log('\nNoyob javoblarni yig\'yapman...');
  const uniqueTexts = new Set();
  const fields = ['javob_1', 'javob_2', 'javob_3', 'javob_4', 'togri_javob'];

  for (const q of data) {
    for (const field of fields) {
      const text = q[field];
      if (text && text.trim() !== '') {
        uniqueTexts.add(text);
      }
    }
  }

  console.log(`${uniqueTexts.size} ta noyob javob topildi`);

  // 2-qadam: Har birini tarjima qilish
  const translations = new Map();
  let done = 0;
  const total = uniqueTexts.size;
  const texts = Array.from(uniqueTexts);

  // Batch tarjima (10 tadan)
  const BATCH_SIZE = 5;
  const DELAY_MS = 200; // Har batch orasida kutish

  console.log(`\nTarjima boshlanmoqda (${total} ta)...\n`);

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (text) => {
      const translated = await translateText(text);
      translations.set(text, translated);
    });

    await Promise.all(promises);
    done += batch.length;

    // Progress
    const pct = Math.round((done / total) * 100);
    process.stdout.write(`\r  [${pct}%] ${done}/${total} tarjima qilindi`);

    // Rate limit
    if (i + BATCH_SIZE < texts.length) {
      await sleep(DELAY_MS);
    }
  }

  console.log('\n');

  // 3-qadam: Tarjimalarni JSONga qo'yish
  console.log('Tarjimalarni JSONga yozyapman...');
  let applied = 0;

  for (const q of data) {
    for (const field of fields) {
      const rusField = field + '_rus';
      const uzText = q[field];

      if (!uzText || uzText.trim() === '') {
        q[rusField] = '';
        continue;
      }

      const translated = translations.get(uzText);
      if (translated) {
        q[rusField] = translated;
        applied++;
      }
    }
  }

  console.log(`${applied} ta javob tarjima qilindi`);

  // 4-qadam: Faylni saqlash
  console.log('Faylni saqlayapman...');
  fs.writeFileSync(OUTPUT, JSON.stringify(data, null, 2), 'utf-8');

  console.log('\n========================================');
  console.log('  TAYYOR! JSON fayl yangilandi');
  console.log(`  ${applied} ta javob rus tiliga tarjima qilindi`);
  console.log('========================================');
}

main().catch(err => {
  console.error('Xatolik:', err);
  process.exit(1);
});
