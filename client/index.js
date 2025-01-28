const axios = require('axios');
const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const FormData = require('form-data');
const cron = require('node-cron');

// Status-Flag, um parallele Übertragungen zu vermeiden
let isRunning = false;

// Logging-Funktion mit Priorität
function log(priority, message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${priority}] ${message}\n`;
  fsSync.appendFileSync('./client.log', logMessage);
  console.log(logMessage.trim());
}

// Funktion zum Hochladen einer Datei
async function uploadFile(filePath, relativePath, config) {
  if (config.dryRun) {
    log('INFO', `Dry Run: Würde Datei hochladen: ${filePath}`);
    return true;
  }

  const stats = await fs.stat(filePath);

  const form = new FormData();
  form.append('file', fsSync.createReadStream(filePath));
  form.append('relativePath', relativePath);
  form.append('createdAt', stats.birthtime.toISOString());
  form.append('modifiedAt', stats.mtime.toISOString());

  const headers = form.getHeaders();

  try {
    const response = await axios.post(config.serverUrl, form, { headers });
    if (response.data.success) {
      log('INFO', `Erfolg: ${filePath} wurde hochgeladen`);
      return true;
    }
  } catch (err) {
    log('ERROR', `Fehler beim Hochladen von ${filePath}: ${err.message}`);
    return false;
  }
}

// Funktion zum Verarbeiten von Dateien
async function processFiles(dir, baseDir = '', config) {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.join(baseDir, entry.name);

    if (entry.isDirectory()) {
      await processFiles(fullPath, relativePath, config);
    } else {
      const success = await uploadFile(fullPath, baseDir, config);
      if (success && config.deleteSourceFile) {
        if (config.dryRun) {
          log('INFO', `Dry Run: Würde Datei löschen: ${fullPath}`);
        } else {
          await fs.unlink(fullPath);
          log('INFO', `Datei gelöscht: ${fullPath}`);
        }
      }
    }
  }
}

// Hauptprogramm: Steuerung durch Cron-Job
async function startProcess() {
  if (isRunning) {
    log('WARN', 'Übertragung läuft bereits, neue Übertragung wird ausgesetzt.');
    return;
  }

  isRunning = true;
  try {
    // Config einlesen
    const config = JSON.parse(await fs.readFile('./config.json', 'utf-8'));
    const sourcePath = path.resolve(config.sourcePath);

    log('INFO', 'Übertragung gestartet.');
    await processFiles(sourcePath, '', config);
    log('INFO', 'Übertragung abgeschlossen.');
  } catch (err) {
    log('ERROR', `Fehler während der Übertragung: ${err.message}`);
  } finally {
    isRunning = false;
  }
}

// Cron-Job einrichten
async function setupCronJob() {
  const config = JSON.parse(await fs.readFile('./config.json', 'utf-8'));
  const cronSchedule = config.cronSchedule;

  if (!cron.validate(cronSchedule)) {
    log('ERROR', 'Ungültiger Cron-String in der config.json.');
    return;
  }

  cron.schedule(cronSchedule, startProcess);
  log('INFO', `Cron-Job mit Zeitplan "${cronSchedule}" gestartet.`);
}

// Initialisierung
(async () => {
  try {
    await setupCronJob();
  } catch (err) {
    log('ERROR', `Fehler beim Starten des Clients: ${err.message}`);
  }
})();
