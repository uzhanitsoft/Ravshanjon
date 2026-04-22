const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ====== AUTO-EXTRACT IMAGES FROM ZIP ======
function extractImagesIfNeeded() {
  const imagesDir = path.join(__dirname, 'public', 'images');
  const zipPath = path.join(__dirname, 'public', 'images.zip');

  // Agar images papkasi yo'q yoki bo'sh bo'lsa — ZIP dan ochish
  if (!fs.existsSync(imagesDir) || fs.readdirSync(imagesDir).length === 0) {
    if (fs.existsSync(zipPath)) {
      console.log('📦 Rasmlarni images.zip dan ochish...');
      if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

      const AdmZip = require('adm-zip');
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(imagesDir, true);

      const count = fs.readdirSync(imagesDir).length;
      console.log(`✅ ${count} ta rasm ochildi!`);
    } else {
      console.log('⚠️  images.zip topilmadi, rasmlar yuklanmaydi');
    }
  } else {
    const count = fs.readdirSync(imagesDir).filter(f => /\.(webp|png|jpg)$/i.test(f)).length;
    console.log(`🖼️  ${count} ta rasm mavjud`);
  }
}

extractImagesIfNeeded();

// Serve static files from public/
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      // HTML hech qachon keshlanmasin
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    }
    if (filePath.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
    }
    if (filePath.match(/\.(png|webp|jpg|jpeg)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚗 PDD Test Manager running on port ${PORT}`);
});
