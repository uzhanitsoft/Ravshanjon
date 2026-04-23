// Скрипт v3: ФИНАЛЬНЫЙ — Русские ответы в JSON
// Фразы + слова + суффиксы
// Запуск: node add_russian.js

const fs = require('fs');
const path = require('path');

const INPUT = path.join(__dirname, 'pdd-app', 'public', 'pdd_savollar_barchasi.json');
const OUTPUT = INPUT;

// =========================================================
// ФРАЗОВЫЙ СЛОВАРЬ (применяется первым, от длинных к коротким)
// =========================================================
const PHRASES = [
  // === ПОЛНЫЕ ОТВЕТЫ ===
  ["Yuqoridagi barcha holatlar", "Все перечисленные случаи"],
  ["Yuqoridagilarning barchasi", "Все перечисленные"],
  ["Yuqoridagi barcha javoblar to'g'ri", "Все ответы верны"],
  ["Yuqoridagi ikkala javob to'g'ri", "Оба ответа верны"],
  ["Hamma sanab o'tilgan transport vositalaridan", "Всех перечисленных транспортных средств"],
  ["Hamma sanab o'tilganlar", "Все перечисленные"],
  ["Barcha sanab o'tilganlar", "Все перечисленные"],
  ["Hech qaysisiga", "Ни одному"],
  ["Hech qaysi biriga", "Ни одному из них"],
  ["Hech qaysisi", "Ни один"],
  ["Hech biri", "Ни один"],

  // === РАЗРЕШЕНИЕ/ЗАПРЕТ ===
  ["Ruxsat etiladi", "Разрешается"],
  ["ruxsat etiladi", "разрешается"],
  ["Ruxsat etilmaydi", "Не разрешается"],
  ["ruxsat etilmaydi", "не разрешается"],
  ["ruxsat beriladi", "разрешается"],
  ["Ruxsat beriladi", "Разрешается"],
  ["Taqiqlanadi", "Запрещается"],
  ["taqiqlanadi", "запрещается"],
  ["Taqiqlanmaydi", "Не запрещается"],
  ["Ha, ruxsat etiladi", "Да, разрешается"],
  ["Yo'q, taqiqlanadi", "Нет, запрещается"],
  ["Bermaydi", "Не даёт"],
  ["bermaydi", "не даёт"],
  ["Beradi", "Даёт"],
  ["beradi", "даёт"],
  ["Majburiy emas", "Не обязательно"],
  ["Shart emas", "Не обязательно"],
  ["Majburiy", "Обязательно"],

  // === ПОРЯДКОВЫЕ ===
  ["Birinchi", "Первый"], ["birinchi", "первый"],
  ["Ikkinchi", "Второй"], ["ikkinchi", "второй"],
  ["Uchinchi", "Третий"], ["uchinchi", "третий"],
  ["To'rtinchi", "Четвёртый"], ["to'rtinchi", "четвёртый"],
  ["Beshinchi", "Пятый"], ["beshinchi", "пятый"],
  ["Oltinchi", "Шестой"], ["oltinchi", "шестой"],
  ["Oxirgi", "Последний"], ["oxirgi", "последний"],

  // === ТС ФРАЗЫ ===
  ["ruxsat etilgan to'la vazn", "разрешённая полная масса"],
  ["transport vositalarining haydovchilariga", "водителям транспортных средств"],
  ["transport vositasining haydovchisi", "водитель транспортного средства"],
  ["transport vositalarining haydovchilari", "водители транспортных средств"],
  ["transport vositasi haydovchisi", "водитель транспортного средства"],
  ["transport vositalaridan", "из транспортных средств"],
  ["transport vositalariga", "транспортным средствам"],
  ["transport vositalarini", "транспортные средства"],
  ["transport vositalarining", "транспортных средств"],
  ["transport vositalari", "транспортные средства"],
  ["transport vositasini", "транспортное средство"],
  ["transport vositasiga", "транспортному средству"],
  ["transport vositasida", "в транспортном средстве"],
  ["transport vositasining", "транспортного средства"],
  ["transport vositasi", "транспортное средство"],
  ["Transport vositasi", "Транспортное средство"],
  ["Transport vositalari", "Транспортные средства"],

  // Водитель + ТС
  ["engil avtomobil haydovchisi", "водитель легкового автомобиля"],
  ["Engil avtomobil haydovchisi", "Водитель легкового автомобиля"],
  ["engil avtomobil haydovchisiga", "водителю легкового автомобиля"],
  ["yuk avtomobil haydovchisi", "водитель грузового автомобиля"],
  ["yuk avtomobili haydovchisi", "водитель грузового автомобиля"],
  ["avtomobil haydovchisi", "водитель автомобиля"],
  ["Avtomobil haydovchisi", "Водитель автомобиля"],
  ["avtobus haydovchisi", "водитель автобуса"],
  ["Avtobus haydovchisi", "Водитель автобуса"],
  ["motosikl haydovchisi", "водитель мотоцикла"],
  ["Motosikl haydovchisi", "Водитель мотоцикла"],
  ["tramvay haydovchisi", "водитель трамвая"],
  ["Tramvay haydovchisi", "Водитель трамвая"],
  ["velosiped haydovchisi", "велосипедист"],

  // ТС виды с суффиксами
  ["engil avtomobillari", "легковые автомобили"],
  ["engil avtomobillar", "легковые автомобили"],
  ["engil avtomobilga", "легковому автомобилю"],
  ["engil avtomobil", "легковой автомобиль"],
  ["Engil avtomobil", "Легковой автомобиль"],
  ["yuk avtomobillari", "грузовые автомобили"],
  ["yuk avtomobillar", "грузовые автомобили"],
  ["yuk avtomobiliga", "грузовому автомобилю"],
  ["yuk avtomobili", "грузовой автомобиль"],
  ["Yuk avtomobil", "Грузовой автомобиль"],
  ["yuk avtomobil", "грузовой автомобиль"],

  // Цвет + ТС
  ["qizil va oq avtomobillarga", "красному и белому автомобилям"],
  ["ko'k, yashil va oq avtomobillarga", "синему, зелёному и белому автомобилям"],
  ["oq, ko'k va sariq avtomobillarga", "белому, синему и жёлтому автомобилям"],
  ["qizil avtomobillarga", "красным автомобилям"],
  ["ko'k avtomobillarga", "синим автомобилям"],
  ["sariq va qizil avtomobilga", "жёлтому и красному автомобилю"],
  ["Sariq va qizil avtomobilga", "Жёлтому и красному автомобилю"],
  ["oq va yashil avtomobilga", "белому и зелёному автомобилю"],
  ["Oq va yashil avtomobilga", "Белому и зелёному автомобилю"],
  ["avtomobil va avtobus haydovchilariga", "водителям автомобилей и автобусов"],
  ["Avtomobil va avtobus haydovchilariga", "Водителям автомобилей и автобусов"],
  ["avtomobil va motosikl haydovchilariga", "водителям автомобилей и мотоциклов"],
  ["Avtomobil va motosikl haydovchilariga", "Водителям автомобилей и мотоциклов"],
  ["avtobus va motosikl haydovchilari", "водители автобуса и мотоцикла"],
  ["Avtobus va motosikl haydovchilari", "Водители автобуса и мотоцикла"],
  ["engil va yuk avtomobillari haydovchilari", "водители легкового и грузового автомобилей"],
  ["Engil va yuk avtomobillari haydovchilari", "Водители легкового и грузового автомобилей"],
  ["avtomobil va avtobus haydovchisi", "водитель автомобиля и автобуса"],
  ["Avtomobil va avtobus haydovchisi", "Водитель автомобиля и автобуса"],
  ["Qizil avtomobil", "Красный автомобиль"],
  ["qizil avtomobil", "красный автомобиль"],
  ["qizil avtomobilga", "красному автомобилю"],
  ["Ko'k avtomobil", "Синий автомобиль"],
  ["ko'k avtomobil", "синий автомобиль"],
  ["ko'k avtomobilga", "синему автомобилю"],
  ["Sariq avtomobil", "Жёлтый автомобиль"],
  ["sariq avtomobil", "жёлтый автомобиль"],
  ["sariq avtomobilga", "жёлтому автомобилю"],
  ["Yashil avtomobil", "Зелёный автомобиль"],
  ["yashil avtomobil", "зелёный автомобиль"],
  ["yashil avtomobilga", "зелёному автомобилю"],
  ["Oq avtomobil", "Белый автомобиль"],
  ["oq avtomobil", "белый автомобиль"],
  ["oq avtomobilga", "белому автомобилю"],

  // ТС с суффиксами
  ["avtomobillarga", "автомобилям"],
  ["avtomobillarni", "автомобили"],
  ["avtomobillari", "автомобили"],
  ["avtomobillar", "автомобили"],
  ["avtomobilga", "автомобилю"],
  ["avtomobilni", "автомобиль"],
  ["avtomobilda", "в автомобиле"],
  ["avtomobil", "автомобиль"],
  ["Avtomobil", "Автомобиль"],
  ["avtobusga", "автобусу"],
  ["avtobuslar", "автобусы"],
  ["avtobus", "автобус"],
  ["Avtobus", "Автобус"],
  ["Motosiklga", "Мотоциклу"],
  ["motosiklga", "мотоциклу"],
  ["motosikllar", "мотоциклы"],
  ["motosikl", "мотоцикл"],
  ["Motosikl", "Мотоцикл"],
  ["tramvayga", "трамваю"],
  ["tramvaylar", "трамваи"],
  ["tramvay", "трамвай"],
  ["Tramvay", "Трамвай"],
  ["velosipedga", "велосипеду"],
  ["velosiped", "велосипед"],
  ["trolleybus", "троллейбус"],
  ["tirkamali", "с прицепом"],
  ["tirkamasi", "прицеп"],
  ["tirkama", "прицеп"],

  // === УЧАСТНИКИ ===
  ["haydovchilariga", "водителям"],
  ["haydovchilarga", "водителям"],
  ["haydovchilari", "водители"],
  ["haydovchilar", "водители"],
  ["haydovchisiga", "водителю"],
  ["haydovchisi", "водитель"],
  ["haydovchiga", "водителю"],
  ["haydovchining", "водителя"],
  ["haydovchi", "водитель"],
  ["Haydovchi", "Водитель"],
  ["piyodalarga", "пешеходам"],
  ["piyodalar", "пешеходы"],
  ["piyodaga", "пешеходу"],
  ["piyoda", "пешеход"],
  ["Piyoda", "Пешеход"],
  ["yo'lovchilarga", "пассажирам"],
  ["yo'lovchilari", "пассажиры"],
  ["yo'lovchilar", "пассажиры"],
  ["yo'lovchi", "пассажир"],

  // === МАНЁВРЫ ===
  ["birinchi bo'lib o'tadi", "проедет первым"],
  ["ikkinchi bo'lib o'tadi", "проедет вторым"],
  ["uchinchi bo'lib o'tadi", "проедет третьим"],
  ["oxirgi bo'lib o'tadi", "проедет последним"],
  ["birinchi bo'lib", "первым"],
  ["ikkinchi bo'lib", "вторым"],
  ["harakatlanish huquqiga ega", "имеет право двигаться"],
  ["harakatlanish taqiqlanadi", "движение запрещено"],
  ["harakatlanishga ruxsat etiladi", "движение разрешается"],
  ["harakatlanishga", "к движению"],
  ["harakatlanishi kerak", "должен двигаться"],
  ["harakatlanayotgan", "движущийся"],
  ["harakatlanish", "движение"],
  ["Harakatlanish", "Движение"],
  ["to'g'riga harakatlanish", "движение прямо"],
  ["chapga burilish", "поворот налево"],
  ["o'ngga burilish", "поворот направо"],
  ["qayrilib olish", "разворот"],
  ["Qayrilib olish", "Разворот"],
  ["orqaga harakatlanish", "движение задним ходом"],
  ["Orqaga harakatlanish", "Движение задним ходом"],
  ["o'tib ketish", "обгон"],
  ["quvib o'tish", "обгон"],
  ["chetlab o'tish", "объезд"],
  ["to'xtab turish", "стоянка"],
  ["To'xtab turish", "Стоянка"],
  ["to'xtab turishga", "для стоянки"],
  ["to'xtash joyi", "место остановки"],
  ["to'xtashga", "для остановки"],
  ["to'xtashi kerak", "должен остановиться"],
  ["to'xtash", "остановка"],
  ["To'xtash", "Остановка"],

  // Скорость
  ["tezlikni kamaytirish", "снижение скорости"],
  ["tezlikni oshirish", "увеличение скорости"],
  ["tezlik bilan", "со скоростью"],
  ["tezlikda", "на скорости"],
  ["tezlik", "скорость"],

  // Направления
  ["to'g'riga", "прямо"],
  ["chapga", "налево"],
  ["Chapga", "Налево"],
  ["o'ngga", "направо"],
  ["O'ngga", "Направо"],
  ["yo'nalish bo'ylab", "по направлению"],
  ["yo'nalishlar bo'ylab", "по направлениям"],
  ["yo'nalishlari bo'ylab", "по направлениям"],

  // Приоритет
  ["yo'l berish", "уступить дорогу"],
  ["yo'l berishi kerak", "должен уступить дорогу"],
  ["ustunlikka ega", "имеет преимущество"],
  ["ustunlik", "преимущество"],

  // Дорога/объекты
  ["temir yo'l o'tish joyi", "железнодорожный переезд"],
  ["piyodalar o'tish joyi", "пешеходный переход"],
  ["avtomagistralda", "на автомагистрали"],
  ["avtomagistral", "автомагистраль"],
  ["chorrahadan", "через перекрёсток"],
  ["chorrahada", "на перекрёстке"],
  ["chorraha", "перекрёсток"],
  ["yo'l belgilari", "дорожные знаки"],
  ["yo'l belgisi", "дорожный знак"],
  ["yo'l chiziqlari", "дорожная разметка"],
  ["yo'l qoidalari", "ПДД"],

  // Свет/фары
  ["yaqinni yoritish faralarini", "фары ближнего света"],
  ["uzoqni yoritish faralarini", "фары дальнего света"],
  ["uzoqni yoritish chiroqlarini", "дальний свет фар"],
  ["yaqinni yoritish chiroqlarini", "ближний свет фар"],
  ["tumanga qarshi faralarni", "противотуманные фары"],
  ["Tumanga qarshi faralarni", "Противотуманные фары"],
  ["gabarit chiroqlarini", "габаритные огни"],
  ["Gabarit chiroqlarini", "Габаритные огни"],
  ["faralarning", "фар"],
  ["faralarni", "фары"],
  ["faralar", "фары"],
  ["chiroqlarini", "огни"],
  ["chiroqlar", "огни"],
  ["yoqishi", "включить"],
];

// =========================================================
// ПОСЛОВНЫЙ СЛОВАРЬ (целые слова с вариациями суффиксов)
// =========================================================
const WORD_MAP = {
  "Qizilga": "Красному", "qizilga": "красному",
  "Qizil": "Красный", "qizil": "красный",
  "Sariqqa": "Жёлтому", "sariqqa": "жёлтому",
  "Sariq": "Жёлтый", "sariq": "жёлтый",
  "Yashilga": "Зелёному", "yashilga": "зелёному",
  "Yashil": "Зелёный", "yashil": "зелёный",
  "Ko'kka": "Синему", "ko'kka": "синему",
  "Ko'k": "Синий", "ko'k": "синий",
  "Oqqa": "Белому", "oqqa": "белому",

  "Faqat": "Только", "faqat": "только",
  "Barcha": "Все", "barcha": "все",
  "barchasi": "все",
  "Ikkala": "Оба", "ikkala": "оба",
  "ikkovi": "оба",
  "yoki": "или",
  "hamda": "а также",
  "lekin": "но",
  "bilan": "с",
  "uchun": "для",
  "kerak": "нужно",
  "bo'ylab": "по",
  "haqida": "о",
  "sababli": "по причине",
  "holatda": "в случае",
  "holatlarda": "в случаях",
  "vaqtida": "во время",
  "paytida": "во время",
  "oldin": "до",
  "keyin": "после",
  "ichida": "внутри",
  "tashqarida": "за пределами",
  "ostida": "под",
  "ustida": "над",
  "oldida": "перед",
  "orqasida": "сзади",
  "yonida": "рядом",
  "orasida": "между",

  "va": "и",
  "Ha": "Да",
  "Yo'q": "Нет",
};

// ====== ФУНКЦИЯ ПЕРЕВОДА ======
function translateToRussian(text) {
  if (!text || typeof text !== 'string' || text.trim() === '') return '';

  // Уже на русском?
  const totalAlpha = (text.match(/[a-zA-Zа-яА-ЯёЁ]/g) || []).length;
  const cyrChars = (text.match(/[а-яА-ЯёЁ]/g) || []).length;
  if (totalAlpha > 0 && (cyrChars / totalAlpha) > 0.8) return text;

  let result = text;

  // Шаг 1: Фразовые замены
  for (const [uz, ru] of PHRASES) {
    if (result.includes(uz)) {
      result = result.split(uz).join(ru);
    }
  }

  // Шаг 2: Пословные замены (только целые слова)
  // Сортируем ключи по длине (длинные первыми)
  const sortedWords = Object.keys(WORD_MAP).sort((a, b) => b.length - a.length);
  for (const word of sortedWords) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/'/g, "[''`ʻ\u2018\u2019]");
    // Граница слова: не-буква или начало/конец строки
    const regex = new RegExp(`(?<![a-zA-Z\u0027\u2018\u2019\u02BB])${escaped}(?![a-zA-Z\u0027\u2018\u2019\u02BB])`, 'g');
    result = result.replace(regex, WORD_MAP[word]);
  }

  // Шаг 3: Специальная обработка "Oq" как отдельного слова (белый)
  // Только если это отдельное слово, не часть другого
  result = result.replace(/(?<![a-zA-Zа-яА-Я])Oq(?![a-zA-Z\u0027])/g, 'Белый');
  result = result.replace(/(?<![a-zA-Zа-яА-Я])oq(?![a-zA-Z\u0027])/g, 'белый');

  return result;
}

// ====== MAIN ======
console.log('Reading JSON...');
const raw = fs.readFileSync(INPUT, 'utf-8');
const data = JSON.parse(raw);
console.log(`Found ${data.length} questions`);

let fullyDone = 0, partial = 0;

for (const q of data) {
  for (const field of ['javob_1', 'javob_2', 'javob_3', 'javob_4', 'togri_javob']) {
    const rusField = field + '_rus';
    const uzText = q[field] || '';
    if (!uzText.trim()) { q[rusField] = ''; continue; }

    q[rusField] = translateToRussian(uzText);

    const rem = (q[rusField].match(/[a-zA-Z]/g) || []).length;
    const tot = q[rusField].replace(/[\s\d\W]/g, '').length;
    if (tot > 0 && rem / tot > 0.2) partial++; else fullyDone++;
  }
}

console.log(`Fully translated: ${fullyDone}`);
console.log(`Partial: ${partial}`);

fs.writeFileSync(OUTPUT, JSON.stringify(data, null, 2), 'utf-8');
console.log('\nDONE! File updated.');
