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

function getFormattedTimestamp() {
  const now = new Date();
  
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  
  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

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
    const safeRelativePath = path.normalize(req.body.relativePath || '').replace(/^(\.\.(\/|\\|$))+/, '');
    const uploadPath = path.join(UPLOAD_DIR, safeRelativePath);
    const target = path.join(uploadPath, file.originalname);
    if(fs.existsSync(target)){
      const { name, ext } = path.parse(file.originalname);
      const newFileName = `${name}.${getFormattedTimestamp()}${ext}`;
      cb(null, newFileName); 
    }else{
      cb(null, file.originalname); // Original-Dateiname beibehalten
    }
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
  log(`Server läuft auf http://0.0.0.0:${PORT}`);
  sendEmail('Server startet', `Server läuft auf http://0.0.0.0:${PORT}`)
});
