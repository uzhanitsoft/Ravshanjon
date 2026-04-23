const fs = require('fs');
const path = require('path');

// ===== KENGAYTIRILGAN PDD O'zbek → Rus lug'ati =====
const phrases = [
  // ===== TO'LIQ IBORALAR (eng uzunlardan boshlab) =====
  ["Hamma sanab o'tilgan transport vositalaridan", "Все перечисленные транспортные средства"],
  ["Sanab o'tilgan hamma harakatlarni bajarishi", "Выполнить все перечисленные действия"],
  ["Hamma sanab o'tilgan hollarda", "Во всех перечисленных случаях"],
  ["Sanab o'tilgan barcha hollarda", "Во всех перечисленных случаях"],
  ["sanab o'tilgan hollarda", "во всех перечисленных случаях"],
  ["Yuqoridagi barcha holatlar", "Все перечисленные случаи"],
  ["Yuqoridagi barcha hollarda", "Во всех перечисленных случаях"],
  ["Ko'rsatilgan barcha holatlarda", "Во всех указанных случаях"],
  ["Ko'rsatilgan barcha hollarda", "Во всех указанных случаях"],
  ["Barcha sanab o'tilgan", "Все перечисленные"],
  ["Barcha holatlarda", "Во всех случаях"],
  ["barcha holatlarda", "во всех случаях"],
  ["Hech qaysi biriga", "Ни одному"],
  ["Hech biriga", "Ни одному"],

  // Ruxsat / Taqiq
  ["Ruxsat etiladi.", "Разрешается."],
  ["Ruxsat etiladi", "Разрешается"],
  ["ruxsat etiladi", "разрешается"],
  ["Ruxsat etilmaydi", "Не разрешается"],
  ["ruxsat etilmaydi", "не разрешается"],
  ["Ruxsat beriladi", "Разрешается"],
  ["ruxsat beriladi", "разрешается"],
  ["ruxsat etilgan", "разрешённый"],
  ["Ruxsat etilgan", "Разрешённый"],
  ["Taqiqlanadi.", "Запрещается."],
  ["Taqiqlanadi", "Запрещается"],
  ["taqiqlanadi", "запрещается"],
  ["taqiqlangan", "запрещённый"],
  ["Taqiqlangan", "Запрещённый"],

  // Ha/Yo'q/Kerak
  ["Kerak emas.", "Не должен."],
  ["Kerak emas", "Не должен"],
  ["kerak emas", "не должен"],
  ["Kerak.", "Должен."],
  ["Kerak", "Должен"],
  ["kerak", "должен"],
  ["Ha.", "Да."], ["Ha", "Да"],
  ["Yo'q.", "Нет."], ["Yo'q", "Нет"],

  // Tibbiyot
  ["Qattiq taxtada orqasi bilan yotgan holda", "На жёсткой поверхности лёжа на спине"],
  ["Yumshoq tushamada orqasi bilan yotgan holda", "На мягкой подстилке лёжа на спине"],
  ["Qattiq taxtada yoni bilan yotgan holda", "На жёсткой поверхности лёжа на боку"],
  ["jarohatlangan qo'lga", "на повреждённую руку"],
  ["sog'iga kiydiriladi", "на здоровую надевается"],
  ["Taxta bo'lagi", "Кусок доски"],
  ["Tibbiyot qutichasi", "Аптечка"],
  ["tibbiyot qutichasi", "аптечка"],
  ["tibbiy yordam", "медицинская помощь"],
  ["Tibbiyot xodimlariga", "Медицинским работникам"],

  // Ranglar + transport
  ["Qizil avtomobilga", "Красному автомобилю"],
  ["qizil avtomobilga", "красному автомобилю"],
  ["Qizil avtomobil", "Красный автомобиль"],
  ["qizil avtomobil", "красный автомобиль"],
  ["Ko'k avtomobilga", "Синему автомобилю"],
  ["Ko'k avtomobil", "Синий автомобиль"],
  ["ko'k avtomobil", "синий автомобиль"],
  ["Sariq avtomobilga", "Жёлтому автомобилю"],
  ["Sariq avtomobil", "Жёлтый автомобиль"],
  ["sariq avtomobil", "жёлтый автомобиль"],
  ["Yashil avtomobilga", "Зелёному автомобилю"],
  ["Yashil avtomobil", "Зелёный автомобиль"],
  ["yashil avtomobil", "зелёный автомобиль"],
  ["Oq avtomobil", "Белый автомобиль"],
  ["oq avtomobil", "белый автомобиль"],

  ["Qizil va oq avtomobillarga", "Красному и белому автомобилям"],
  ["Ko'k, yashil va oq avtomobillarga", "Синему, зелёному и белому автомобилям"],
  ["Oq, ko'k va sariq avtomobillarga", "Белому, синему и жёлтому автомобилям"],
  ["avtomobillarga", "автомобилям"],
  ["avtomobillar", "автомобили"],
  ["avtomobillari", "автомобилей"],

  ["Qizilga", "Красному"],
  ["Qizil", "Красный"], ["qizil", "красный"],
  ["Ko'k", "Синий"], ["ko'k", "синий"],
  ["Sariq", "Жёлтый"], ["sariq", "жёлтый"],
  ["Yashil", "Зелёный"], ["yashil", "зелёный"],
  ["Oq", "Белый"], ["oq", "белый"],

  // Transport vositalari
  ["Engil avtomobil haydovchisi", "Водитель легкового автомобиля"],
  ["engil avtomobil haydovchisi", "водитель легкового автомобиля"],
  ["Engil avtomobilga", "Легковому автомобилю"],
  ["Engil avtomobil", "Легковой автомобиль"],
  ["engil avtomobil", "легковой автомобиль"],
  ["Engil va yuk avtomobillari haydovchilari", "Водители легкового и грузового автомобилей"],
  ["Yuk avtomobili haydovchisi", "Водитель грузового автомобиля"],
  ["yuk avtomobili haydovchisi", "водитель грузового автомобиля"],
  ["Yuk avtomobiliga", "Грузовому автомобилю"],
  ["Yuk avtomobili", "Грузовой автомобиль"],
  ["yuk avtomobili", "грузовой автомобиль"],
  ["Yuk avtomobil", "Грузовой автомобиль"],
  ["yuk avtomobil", "грузовой автомобиль"],
  ["Avtomobil haydovchisi", "Водитель автомобиля"],
  ["avtomobil haydovchisi", "водитель автомобиля"],
  ["Avtomobil va avtobus haydovchisi", "Водитель автомобиля и автобуса"],
  ["Avtobus haydovchisi", "Водитель автобуса"],
  ["avtobus haydovchisi", "водитель автобуса"],
  ["Tramvay haydovchisi", "Водитель трамвая"],
  ["tramvay haydovchisi", "водитель трамвая"],
  ["Motosikl haydovchisi", "Водитель мотоцикла"],
  ["motosikl haydovchisi", "водитель мотоцикла"],
  ["haydovchilariga", "водителям"],
  ["haydovchilari", "водители"],
  ["haydovchiga", "водителю"],
  ["haydovchisi", "водитель"],
  ["Haydovchi", "Водитель"], ["haydovchi", "водитель"],

  ["Avtomobilga", "Автомобилю"],
  ["Avtomobil", "Автомобиль"], ["avtomobil", "автомобиль"],
  ["Avtobus", "Автобус"], ["avtobus", "автобус"],
  ["Tramvay", "Трамвай"], ["tramvay", "трамвай"],
  ["Motosikl", "Мотоцикл"], ["motosikl", "мотоцикл"],
  ["motosiklga", "мотоциклу"],
  ["Motosiklga", "Мотоциклу"],
  ["motosikllar", "мотоциклы"],
  ["Velosiped", "Велосипед"], ["velosiped", "велосипед"],
  ["velosipedchilarga", "велосипедистам"],
  ["Moped", "Мопед"], ["moped", "мопед"],
  ["mopedlar", "мопеды"],
  
  ["transport vositalaridan", "транспортных средств"],
  ["transport vositalariga", "транспортным средствам"],
  ["transport vositalarini", "транспортные средства"],
  ["transport vositalari", "транспортные средства"],
  ["transport vositasining", "транспортного средства"],
  ["Transport vositasining", "Транспортного средства"],
  ["transport vositasini", "транспортное средство"],
  ["transport vositasi", "транспортное средство"],
  ["Transport vositasi", "Транспортное средство"],
  ["transport vositasiga", "транспортному средству"],

  // Yo'l elementlari
  ["piyodalar o'tish joyi", "пешеходный переход"],
  ["Piyodalar o'tish joyi", "Пешеходный переход"],
  ["piyodalarga", "пешеходам"],
  ["Piyodalarga", "Пешеходам"],
  ["piyodalar", "пешеходы"], ["Piyodalar", "Пешеходы"],
  ["piyoda", "пешеход"], ["Piyoda", "Пешеход"],
  
  ["qatnov qismining", "проезжей части"],
  ["qatnov qismidan", "проезжей части"],
  ["qatnov qismi", "проезжая часть"],
  ["Qatnov qismi", "Проезжая часть"],
  
  ["chorrahadan", "перекрёсток"],
  ["Chorrahadan", "Перекрёсток"],
  ["chorrahaga", "на перекрёсток"],
  ["Chorrahaga", "На перекрёсток"],
  ["chorrahada", "на перекрёстке"],
  ["Chorrahada", "На перекрёстке"],
  ["Chorraha", "Перекрёсток"], ["chorraha", "перекрёсток"],

  ["temir yo'l kesishmasi", "железнодорожный переезд"],
  ["temir yo'l kesishmasiga", "к железнодорожному переезду"],
  ["temir yo'l", "железная дорога"],
  ["Temir yo'l", "Железная дорога"],

  ["svetoforning", "светофора"],
  ["Svetofor", "Светофор"], ["svetofor", "светофор"],
  
  ["yo'l belgisi", "дорожный знак"],
  ["Yo'l belgisi", "Дорожный знак"],
  ["yo'l belgilari", "дорожные знаки"],
  ["belgisi bilan", "знаком"],
  ["belgisi", "знак"], ["Belgisi", "Знак"],
  ["belgilari", "знаки"],
  ["belgida", "на знаке"],
  ["belgi", "знак"], ["Belgi", "Знак"],
  
  ["trotuar", "тротуар"], ["Trotuar", "Тротуар"],
  
  ["ajratuvchi bo'lak", "разделительная полоса"],
  ["Ajratuvchi bo'lak", "Разделительная полоса"],
  ["harakat bo'lagi", "полоса движения"],
  ["Harakat bo'lagi", "Полоса движения"],
  ["bo'lagidan", "с полосы"],
  ["bo'lakdan", "с полосы"],
  ["bo'lakni", "полосу"],
  ["bo'lagi", "полоса"],
  ["bo'lakli", "полосная"],
  ["bo'lak", "полоса"], ["Bo'lak", "Полоса"],

  // Harakatlar
  ["harakatlanishga ruxsat etiladi", "движение разрешается"],
  ["Harakatlanishga ruxsat etiladi", "Движение разрешается"],
  ["harakatlanish taqiqlanadi", "движение запрещается"],
  ["harakatlanishni boshlash", "начало движения"],
  ["harakatlanish boshlanishi", "начало движения"],
  ["harakatlanishiga", "движению"],
  ["harakatlanishga", "движению"],
  ["harakatlanayotgan", "движущийся"],
  ["harakatlanish", "движение"],
  ["Harakatlanish", "Движение"],
  ["harakatlantirish", "движение"],
  ["harakat", "движение"], ["Harakat", "Движение"],
  
  ["to'xtab turish", "стоянка"],
  ["To'xtab turish", "Стоянка"],
  ["to'xtab turishga", "стоянке"],
  ["to'xtashga", "остановке"],
  ["to'xtash", "остановка"],
  ["To'xtash", "Остановка"],
  
  ["burilishga", "повороту"],
  ["burilish", "поворот"], ["Burilish", "Поворот"],
  ["qayrilish", "разворот"], ["Qayrilish", "Разворот"],
  ["qayrilib olish", "разворот"],
  
  ["quvib o'tish", "обгон"],
  ["Quvib o'tish", "Обгон"],
  ["quvib o'tishga", "обгону"],
  ["o'tib ketish", "обгон"],

  ["tormozlash", "торможение"],
  ["Tormozlash", "Торможение"],
  ["tormoz tizimi", "тормозная система"],
  ["tormoz", "тормоз"], ["Tormoz", "Тормоз"],

  ["shatakka olish", "буксировка"],
  ["Shatakka olish", "Буксировка"],
  ["shatakka olishga", "буксировке"],

  // Yo'nalishlar
  ["yo'nalish bo'ylab", "по направлению"],
  ["yo'nalishlari bo'ylab", "по направлениям"],
  ["yo'nalishda", "в направлении"],
  ["yo'nalishlarda", "в направлениях"],
  ["yo'nalishdan", "с направления"],
  ["yo'nalishi", "направление"],
  ["yo'nalish", "направление"],

  ["chapga burilish", "поворот налево"],
  ["o'ngga burilish", "поворот направо"],
  ["to'g'riga", "прямо"], ["To'g'riga", "Прямо"],
  ["chapga", "налево"], ["Chapga", "Налево"],
  ["o'ngga", "направо"], ["O'ngga", "Направо"],
  ["orqaga", "назад"], ["Orqaga", "Назад"],

  ["Faqat", "Только"], ["faqat", "только"],
  
  // Tezlik
  ["eng katta tezlik", "максимальная скорость"],
  ["tezlik bilan", "со скоростью"],
  ["tezlik", "скорость"], ["Tezlik", "Скорость"],
  ["km/c", "км/ч"], ["km/s", "км/ч"],

  // Vaqt
  ["kunning qorong'i vaqtida", "в тёмное время суток"],
  ["Kunning qorong'i vaqtida", "В тёмное время суток"],
  ["kunning yorug' vaqtida", "в светлое время суток"],

  // Masofalar
  ["metrdan ortiq", "метров и более"],
  ["metrdan kam", "метров и менее"],
  ["metr", "метров"],
  ["gradus", "градус"],

  // Chiroqlar
  ["gabarit chiroqlari", "габаритные огни"],
  ["gabarit chiroqlarini", "габаритные огни"],
  ["tumanga qarshi chiroqlar", "противотуманные фары"],
  ["chiroqlar", "фары/огни"],
  ["chiroq", "фара"], ["Chiroq", "Фара"],

  // Boshqa transport terminlari
  ["oldingi g'ildiraklar", "передние колёса"],
  ["Oldingi g'ildiraklar", "Передние колёса"],
  ["orqa g'ildiraklar", "задние колёса"],
  ["Orqa g'ildiraklar", "Задние колёса"],
  ["g'ildiraklar", "колёса"],
  
  ["uzatma ulangan holda", "с включённой передачей"],
  ["Uzatma ulangan holda", "С включённой передачей"],
  ["uzatma ajratilgan holda", "с выключенной передачей"],

  ["ishchi tormoz", "рабочий тормоз"],
  ["Ishchi tormoz", "Рабочий тормоз"],
  ["to'xtab turish tormozi", "стояночный тормоз"],
  ["To'xtab turish tormozi", "Стояночный тормоз"],
  ["to'xtab turish tormozi bilan", "стояночным тормозом"],

  ["egiluvchan tirkagich", "гибкая сцепка"],
  ["Egiluvchan tirkagich", "Гибкая сцепка"],
  ["qattiq tirkagich", "жёсткая сцепка"],
  ["Qattiq tirkagich", "Жёсткая сцепка"],
  ["tirkagich", "прицеп"],
  ["Tirkamali", "С прицепом"],
  ["tirkamali", "с прицепом"],

  ["ruxsat etilgan to'la vazni", "разрешённая полная масса"],
  ["to'la vazni", "полная масса"],

  // Aholi punktlari
  ["aholi punktlaridan tashqarida", "вне населённых пунктов"],
  ["Aholi punktlaridan tashqarida", "Вне населённых пунктов"],
  ["aholi punktlarida", "в населённых пунктах"],
  ["Aholi punktlarida", "В населённых пунктах"],
  ["aholi punkti", "населённый пункт"],
  ["aholi yashaydigan joylarda", "в населённых пунктах"],

  // Tartibga soluvchi
  ["tartibga soluvchining", "регулировщика"],
  ["Tartibga soluvchining", "Регулировщика"],
  ["tartibga soluvchi", "регулировщик"],
  ["Tartibga soluvchi", "Регулировщик"],

  // Avtomagistrali
  ["avtomagistralda", "на автомагистрали"],
  ["Avtomagistralda", "На автомагистрали"],
  ["avtomagistral", "автомагистраль"],

  // Umumiy
  ["yo'l berishi kerak", "должен уступить дорогу"],
  ["yo'l berish", "уступить дорогу"],
  ["halaqit bermaslik", "не создавая помех"],
  ["halaqit bermasligiga", "не создавая помех"],
  ["havfsiz bo'lishiga", "безопасности"],
  ["havfsizlik", "безопасность"],
  ["ishonch hosil qilishi", "убедиться"],
  ["tekshirishi", "проверить"],
  ["bajarishi", "выполнить"],
  
  ["qarama-qarshi", "встречное"],
  ["ikki tomonlama", "двустороннее"],
  ["bir tomonlama", "одностороннее"],
  
  ["Ikkala", "Оба"], ["ikkala", "оба"],
  ["Ikkita", "Два"], ["ikkita", "два"],
  ["birinchi navbatda", "в первую очередь"],
  ["Birinchi", "Первым"], ["birinchi", "первым"],
  ["Ikkinchi", "Вторым"], ["ikkinchi", "вторым"],
  ["Uchinchi", "Третьим"], ["uchinchi", "третьим"],
  
  ["bo'ylab", "вдоль/по"],
  ["tashqarida", "за пределами"],
  ["ichida", "внутри"],
  ["ustida", "на/над"],
  ["ostida", "под"],
  ["oldida", "перед"],
  ["orqasida", "позади"],
  
  ["o'rnatiladi", "устанавливается"],
  ["o'rnatilgan", "установленный"],
  ["ko'rsatilgan", "указанный"],
  ["belgilangan", "установленный"],
  ["bildiradi", "означает"],
  ["ogohlantiradi", "предупреждает"],

  ["shovqin hosil qilmasligi", "не создавал шума"],
  ["chang ko'tarmasligi", "не поднимал пыли"],
  ["atrof-muxitni iflos qilmasligi", "не загрязнял окружающую среду"],
  
  ["o't o'chirgich", "огнетушитель"],
  ["O't o'chirgich", "Огнетушитель"],

  ["xizmat vazifalarini", "служебные обязанности"],
  ["Kechiktirib bo'lmaydigan", "Неотложные"],
  ["kechiktirib bo'lmaydigan", "неотложные"],

  // Kajavasiz
  ["Kajavasiz motosikllar, mopedlar va velosipedlar", "Мотоциклы без коляски, мопеды и велосипеды"],
  ["Kajavasiz motosikllar", "Мотоциклы без коляски"],
  ["Kajavali motosikllar", "Мотоциклы с коляской"],
  ["kajavasiz", "без коляски"],
  ["kajavali", "с коляской"],
  
  // O'lchamlar
  ["Istalgan usulda ruxsat etilgan", "Разрешена любым способом"],
  ["istalgan usulda", "любым способом"],
  
  ["dan ortiq", "и более"],
  ["dan kam", "и менее"],
  
  // Suffixlar va qo'shimchalar
  ["bo'lgan", "имеющий"],
  ["bo'lmagan", "не имеющий"],
  ["bo'lsa", "если"],
  
  ["bilan birga", "совместно с"],
  ["bilan", "с/со"],
  
  ["uchun", "для"],
  ["haqida", "о/об"],
  ["tomoniga", "в сторону"],
  ["tomonidan", "со стороны"],
];

// Tarjima funksiyasi
function translateToRussian(text) {
  if (!text || text.trim() === '') return '';
  let result = text;
  
  for (const [uz, ru] of phrases) {
    if (result.includes(uz)) {
      result = result.split(uz).join(ru);
    }
  }
  
  return result;
}

// ===== ASOSIY SKRIPT =====
const jsonPath = path.join(__dirname, 'pdd-app', 'public', 'pdd_savollar_barchasi.json');

console.log('📖 Savollar bazasini o\'qish...');
const rawData = fs.readFileSync(jsonPath, 'utf8');
const questions = JSON.parse(rawData);
console.log(`📊 Jami savollar: ${questions.length}`);

let total = 0, full = 0;

for (const q of questions) {
  for (const field of ['javob_1', 'javob_2', 'javob_3', 'javob_4', 'togri_javob']) {
    if (q[field] && q[field].trim() !== '') {
      q[field + '_rus'] = translateToRussian(q[field]);
      total++;
      if (!/[a-zA-Z]/.test(q[field + '_rus'])) full++;
    }
  }
}

const pct = Math.round(full / total * 100);
console.log(`\n📊 Natija: ${full}/${total} to'liq tarjima (${pct}%)`);

// Namunalar
console.log('\n✅ Namunalar:\n');
let shown = 0;
for (const q of questions) {
  if (shown >= 5) break;
  const has = q.javob_1_rus && !/[a-zA-Z]/.test(q.javob_1_rus);
  if (has) {
    console.log(`  Savol ${q.id}: ${q.savol_rus || ''}`);
    for (let j = 1; j <= 4; j++) {
      if (q[`javob_${j}`] && q[`javob_${j}`].trim())
        console.log(`    ${q[`javob_${j}`]} → ${q[`javob_${j}_rus`]}`);
    }
    console.log('');
    shown++;
  }
}

fs.writeFileSync(jsonPath, JSON.stringify(questions, null, 2), 'utf8');
console.log(`💾 Saqlandi!`);
