const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth } = require('../middleware/auth');
const { isObjectStorageConfigured, uploadImageBuffer, deleteImage } = require('../utils/storage');

// Assicurati che la directory uploads esista
const uploadDir = process.env.UPLOAD_PATH
  ? path.resolve(process.env.UPLOAD_PATH)
  : path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configurazione storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'casavista-' + uniqueSuffix + ext);
  }
});

// Filtro file
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo file non supportato. Usa JPG, PNG o WEBP.'), false);
  }
};

const useObjectStorage = isObjectStorageConfigured();

const upload = multer({
  storage: useObjectStorage ? multer.memoryStorage() : storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Upload singola immagine
router.post('/image', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Nessun file caricato.' });
    }

    const storedFile = useObjectStorage
      ? await uploadImageBuffer(req.file)
      : {
          filename: req.file.filename,
          url: `/uploads/${req.file.filename}`
        };
    
    res.json({
      message: 'Immagine caricata.',
      url: storedFile.url,
      filename: storedFile.filename
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Errore durante il caricamento.' });
  }
});

// Upload multiple immagini
router.post('/images', auth, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Nessun file caricato.' });
    }

    const storedFiles = useObjectStorage
      ? await Promise.all(req.files.map(file => uploadImageBuffer(file)))
      : req.files.map(file => ({
          filename: file.filename,
          url: `/uploads/${file.filename}`
        }));
    
    res.json({
      message: `${req.files.length} immagini caricate.`,
      urls: storedFiles.map(file => file.url),
      filenames: storedFiles.map(file => file.filename)
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Errore durante il caricamento.' });
  }
});

// Delete image
router.delete('/image/:filename', auth, async (req, res) => {
  try {
    const filename = req.params.filename;

    if (useObjectStorage) {
      await deleteImage(filename);
      return res.json({ message: 'Immagine eliminata.' });
    }

    const filepath = path.join(uploadDir, filename);

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      res.json({ message: 'Immagine eliminata.' });
    } else {
      res.status(404).json({ message: 'File non trovato.' });
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Errore durante l\'eliminazione.' });
  }
});

module.exports = router;
