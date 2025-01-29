const path = require('path');
const fs = require('fs');
const { Readable } = require('stream');

const express = require('express');
const multiparty = require('multiparty');

const { sendEmail } = require('./mail.js')
const { log } = require('./log.js')
const { getFormattedTimestamp } = require('./utils.js')

const { config } = require('./config');

const app = express();

const UPLOAD_DIR = path.resolve(config.uploadDir || './uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

app.post('/upload', (req, res) => {
    const form = new multiparty.Form({
        autoFiles: false,
        uploadDir: null,
        maxFieldsSize: 100 * 1024 * 1024
    });

    const metadata = {
        relativePath: '',
        createdAt: '',
        modifiedAt: ''
    };

    let fileBuffer = Buffer.from([]);
    let filename = '';

    form.on('field', (name, value) => {
        switch (name) {
            case 'relativePath':
                metadata.relativePath = value;
                break;
            case 'createdAt':
                metadata.createdAt = value;
                break;
            case 'modifiedAt':
                metadata.modifiedAt = value;
                break;
        }
    });

    form.on('part', (part) => {
        if (!part.filename) {
            part.resume();
            return;
        }

        filename = part.filename;

        part.on('data', (chunk) => {
            fileBuffer = Buffer.concat([fileBuffer, chunk]);
        });
    });

    form.on('close', () => {
        const safeRelativePath = path.normalize(metadata.relativePath || '').replace(/^(\.\.(\/|\\|$))+/, '');

        let targetPath = path.join(UPLOAD_DIR, safeRelativePath, filename);
        if (fs.existsSync(targetPath)) {
            const { name, ext } = path.parse(filename);
            const newFileName = `${name}.${getFormattedTimestamp()}${ext}`;
            const newTargetPath = path.join(UPLOAD_DIR, safeRelativePath, newFileName);
            log.warn(`File already exists: '${targetPath}' change to '${newTargetPath}'`);
            targetPath = newTargetPath;
        }

        fs.mkdirSync(path.dirname(targetPath), { recursive: true });

        const readStream = Readable.from(fileBuffer);
        const writeStream = fs.createWriteStream(targetPath);
        readStream.pipe(writeStream);

        writeStream.on('finish', () => {
            // Setze die Zeitstempel, falls angegeben
            if (metadata.createdAt || metadata.modifiedAt) {
                const times = {
                    birthtime: metadata.createdAt ? new Date(metadata.createdAt) : undefined,
                    mtime: metadata.modifiedAt ? new Date(metadata.modifiedAt) : undefined
                };
                fs.utimes(targetPath, times.mtime || new Date(), times.mtime || new Date(), (err) => {
                    if (err) {
                        const subject = `Fehler beim Setzen der Zeitstempel von Datei: '${targetPath}'`;
                        const msg = `${err}`;
                        log.error(subject, err);
                        res.status(500).send(subject + '\n' + msg);
                        // TODO email senden?
                        return;
                    }
                    res.status(200).send('Upload erfolgreich');
                });
            } else {
                res.status(200).send('Upload erfolgreich');
            }
        });

        writeStream.on('error', (err) => {
            const subject = `Fehler beim Schreiben von Datei: ${targetPath}`;
            const msg = `Cause: ${err.cause}\n${err}`;
            log.error(subject, err);
            res.status(500).send(subject + '\n' + msg);
            sendEmail(subject, msg);
        });
    });

    form.on('error', (err) => {
        const subject = `Fehler beim Upload`;
        const msg = `Cause: ${err.cause}\n${err}`;

        log.error(subject, err);
        res.status(500).send(subject + '\n' + msg);
        sendEmail(subject, msg);
    });

    form.parse(req);
});

// Optional: Basis-Route für Tests
app.get('/', (req, res) => {
    res.send('Upload-Server ist aktiv');
});

// Error Handler
app.use((err, req, res, next) => {
    log.error(err.stack);
    res.status(500).send('Etwas ist schief gelaufen!');
});




// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// Multer-Konfiguration
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     try {
//       const safeRelativePath = path.normalize(req.body.relativePath || '').replace(/^(\.\.(\/|\\|$))+/, '');
//       const uploadPath = path.join(UPLOAD_DIR, safeRelativePath);

//       // Zielverzeichnis synchron erstellen
//       fs.mkdirSync(uploadPath, { recursive: true });
//       cb(null, uploadPath);
//     } catch (error) {
//       cb(error);
//     }
//   },
//   filename: (req, file, cb) => {
//     const safeRelativePath = path.normalize(req.body.relativePath || '').replace(/^(\.\.(\/|\\|$))+/, '');
//     const uploadPath = path.join(UPLOAD_DIR, safeRelativePath);
//     const target = path.join(uploadPath, file.originalname);
//     if(fs.existsSync(target)){
//       const { name, ext } = path.parse(file.originalname);
//       const newFileName = `${name}.${getFormattedTimestamp()}${ext}`;
//       cb(null, newFileName); 
//     }else{
//       cb(null, file.originalname); // Original-Dateiname beibehalten
//     }
//   },
// });

// const upload = multer({ storage });
// app.post('/upload', (req, res, next) => {
//   const form = multer().fields([]); // Nur Metadaten auslesen
//   form(req, res, (err) => {
//     if (err) return res.status(400).json({ success: false, message: 'Invalid form-data' });

//     req.uploadRelativePath = getSafeRelativePath(req.body.relativePath || '');
//     next();
//   });
// }, upload.any(), (req, res) => {
//   res.json({ success: true, message: 'Files uploaded successfully' });
// });

// app.post('/upload', upload.any(), async (req, res) => {
//   try {
//     for (const file of req.files) {
//       try {
//         const originalCreatedAt = new Date(req.body.createdAt || Date.now());
//         const originalModifiedAt = new Date(req.body.modifiedAt || Date.now());

//         fs.utimesSync(file.path, originalCreatedAt, originalModifiedAt);
//         log(`Datei empfangen: ${file.originalname}, Relativer Pfad: ${req.body.relativePath}`);
//       } catch (fileError) {
//         log(`Fehler bei Datei ${file.originalname}: ${fileError.message}`);
//         sendEmail('Upload failed', `Konnte Datei nicht speichern: ${file.originalname}`);
//       }
//     }

//     res.json({ success: true, message: 'Dateien hochgeladen' });
//   } catch (err) {
//     log(`Allgemeiner Fehler beim Speichern: ${err.message}`);
//     res.status(500).json({ success: false, message: 'Fehler beim Hochladen' });
//   }
// });

// Server starten
const PORT = config.port || 3000;
app.listen(PORT, () => {
    log(`Server läuft auf http://0.0.0.0:${PORT}`);
    // sendEmail('Server startet', `Server läuft auf http://0.0.0.0:${PORT}`)
});
