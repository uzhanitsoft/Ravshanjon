const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ====== JSON Body Parser ======
app.use(express.json({ limit: '10mb' }));

// ====== PROGRESS STORAGE (file-based) ======
const PROGRESS_DIR = path.join(__dirname, 'data', 'progress');
if (!fs.existsSync(PROGRESS_DIR)) {
  fs.mkdirSync(PROGRESS_DIR, { recursive: true });
}

// Save progress
app.post('/api/progress/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const safeId = userId.replace(/[^a-zA-Z0-9_-]/g, '');
    if (!safeId) return res.status(400).json({ error: 'Invalid userId' });

    const data = {
      ...req.body,
      updatedAt: Date.now()
    };
    
    const filePath = path.join(PROGRESS_DIR, `${safeId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    
    res.json({ success: true, updatedAt: data.updatedAt });
  } catch (err) {
    console.error('Save progress error:', err);
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

// Load progress
app.get('/api/progress/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const safeId = userId.replace(/[^a-zA-Z0-9_-]/g, '');
    if (!safeId) return res.status(400).json({ error: 'Invalid userId' });

    const filePath = path.join(PROGRESS_DIR, `${safeId}.json`);
    if (!fs.existsSync(filePath)) {
      return res.json({ exists: false });
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    res.json({ exists: true, data });
  } catch (err) {
    console.error('Load progress error:', err);
    res.status(500).json({ error: 'Failed to load progress' });
  }
});

// ====== AUTO-EXTRACT IMAGES FROM ZIP ======
function extractImagesIfNeeded() {
  const imagesDir = path.join(__dirname, 'public', 'images');
  const zipPath = path.join(__dirname, 'public', 'images.zip');

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
