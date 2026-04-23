const fs = require('fs');
const json = fs.readFileSync('public/pdd_savollar_barchasi.json', 'utf-8');
const data = JSON.parse(json);

function normalizeQuestion(q, idx) {
  if (q.savol && q.javob_1) {
    return {
      id: q.id || idx + 1,
      bilet_id: q.bilet_id || 1,
      savol: q.savol || q.savol_uz || '',
      savol_kril: q.savol_kril || '',
      savol_rus: q.savol_rus || '',
      rasm: q.rasm || '',
      answers: [q.javob_1, q.javob_2, q.javob_3, q.javob_4].filter(Boolean).map((a, i) => ({
        text: a,
        correct: (i + 1) === q.togri_javob_raqami
      })),
      togri_javob: q.togri_javob || ''
    };
  }
}
const q = normalizeQuestion(data[0], 0);
console.log(q);
