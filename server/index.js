const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { sendEmail } = require('./mail.js')
const { log } = require('./log.js')
const app = express();

const { config } = require('./config');

const UPLOAD_DIR = path.resolve(config.uploadDir || './uploads');

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const PORT = config.port || 3000;

// Multer-Konfiguration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const safeRelativePath = path.normalize(req.body.relativePath || '').replace(/^(\.\.(\/|\\|$))+/, '');
      const uploadPath = path.join(UPLOAD_DIR, safeRelativePath);

      // Zielverzeichnis synchron erstellen
      fs.mkdirSync(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Original-Dateiname beibehalten
  },
});

const upload = multer({ storage });

app.post('/upload', upload.any(), async (req, res) => {
  try {
    for (const file of req.files) {
      try {
        const originalCreatedAt = new Date(req.body.createdAt || Date.now());
        const originalModifiedAt = new Date(req.body.modifiedAt || Date.now());

        fs.utimesSync(file.path, originalCreatedAt, originalModifiedAt);
        log(`Datei empfangen: ${file.originalname}, Relativer Pfad: ${req.body.relativePath}`);
      } catch (fileError) {
        log(`Fehler bei Datei ${file.originalname}: ${fileError.message}`);
        sendEmail('Upload failed', `Konnte Datei nicht speichern: ${file.originalname}`);
      }
    }

    res.json({ success: true, message: 'Dateien hochgeladen' });
  } catch (err) {
    log(`Allgemeiner Fehler beim Speichern: ${err.message}`);
    res.status(500).json({ success: false, message: 'Fehler beim Hochladen' });
  }
});

// Server starten
app.listen(PORT, () => {
  log(`Server läuft auf http://localhost:${PORT}`);
  sendEmail('Server startet', `Server läuft auf http://localhost:${PORT}`)
});
