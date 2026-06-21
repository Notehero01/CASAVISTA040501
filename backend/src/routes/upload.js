const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { auth } = require('../middleware/auth');
const { isObjectStorageConfigured, uploadImageBuffer, deleteImage } = require('../utils/storage');

// Assicurati che la directory uploads esista
const uploadDir = process.env.UPLOAD_PATH
  ? path.resolve(process.env.UPLOAD_PATH)
  : path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const useObjectStorage = isObjectStorageConfigured();
const MAX_IMAGES_PER_ANNUNCIO = 30;
const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: MAX_IMAGES_PER_ANNUNCIO,
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

function detectImageType(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: 'image/jpeg', extension: '.jpg' };
  }

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mime: 'image/png', extension: '.png' };
  }

  if (
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { mime: 'image/webp', extension: '.webp' };
  }

  return null;
}

function prepareImageFile(file) {
  const detected = detectImageType(file.buffer);
  if (!detected || !allowedMimeTypes.has(detected.mime)) {
    const error = new Error('File non valido. Carica solo immagini JPG, PNG o WEBP.');
    error.statusCode = 400;
    throw error;
  }

  if (file.mimetype && allowedMimeTypes.has(file.mimetype) && file.mimetype !== detected.mime) {
    const error = new Error('Il tipo del file non corrisponde al contenuto dell\'immagine.');
    error.statusCode = 400;
    throw error;
  }

  file.detectedMime = detected.mime;
  file.mimetype = detected.mime;
  file.safeExtension = detected.extension;
  return file;
}

function storeLocalImage(file) {
  const filename = `casavista-${Date.now()}-${crypto.randomBytes(12).toString('hex')}${file.safeExtension}`;
  const filepath = path.resolve(uploadDir, filename);
  const uploadRoot = path.resolve(uploadDir);

  if (!filepath.startsWith(uploadRoot + path.sep)) {
    const error = new Error('Nome file non valido.');
    error.statusCode = 400;
    throw error;
  }

  fs.writeFileSync(filepath, file.buffer);

  return {
    filename,
    url: `/uploads/${filename}`
  };
}

function sanitizeUploadFilename(filename) {
  const value = String(filename || '');
  const basename = path.basename(value);

  if (basename !== value) return null;
  if (!/^casavista-[a-zA-Z0-9._-]+\.(jpg|jpeg|png|webp)$/.test(basename)) return null;

  return basename;
}

// Upload singola immagine
router.post('/image', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Nessun file caricato.' });
    }

    const imageFile = prepareImageFile(req.file);
    const storedFile = useObjectStorage
      ? await uploadImageBuffer(imageFile)
      : storeLocalImage(imageFile);
    
    res.json({
      message: 'Immagine caricata.',
      url: storedFile.url,
      filename: storedFile.filename
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : 'Errore durante il caricamento.' });
  }
});

// Upload multiple immagini
router.post('/images', auth, upload.array('images', MAX_IMAGES_PER_ANNUNCIO), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Nessun file caricato.' });
    }

    const imageFiles = req.files.map(prepareImageFile);
    const storedFiles = useObjectStorage
      ? await Promise.all(imageFiles.map(file => uploadImageBuffer(file)))
      : imageFiles.map(storeLocalImage);
    
    res.json({
      message: `${req.files.length} immagini caricate.`,
      urls: storedFiles.map(file => file.url),
      filenames: storedFiles.map(file => file.filename)
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : 'Errore durante il caricamento.' });
  }
});

// Delete image
router.delete('/image/:filename', auth, async (req, res) => {
  try {
    const filename = sanitizeUploadFilename(req.params.filename);
    if (!filename) {
      return res.status(400).json({ message: 'Nome file non valido.' });
    }

    if (useObjectStorage) {
      await deleteImage(filename);
      return res.json({ message: 'Immagine eliminata.' });
    }

    const filepath = path.resolve(uploadDir, filename);
    const uploadRoot = path.resolve(uploadDir);

    if (!filepath.startsWith(uploadRoot + path.sep)) {
      return res.status(400).json({ message: 'Nome file non valido.' });
    }

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
