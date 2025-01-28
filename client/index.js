const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const cron = require('node-cron');
const cronParser = require('cron-parser');
const humanizeDuration = require('humanize-duration');

// Status-Flag, um parallele Übertragungen zu vermeiden
let isRunning = false;

const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

if (!cron.validate(config.cronSchedule)) {
  log('ERROR', 'Ungültiger Cron-String in der config.json.');
  return;
}

// Logging-Funktion mit Priorität
function log(priority, message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${priority}] ${message}\n`;
  fs.appendFileSync('./client.log', logMessage);
  console.log(logMessage.trim());
}

// Funktion zum Hochladen einer Datei
async function uploadFile(filePath, relativePath, config) {
  if (config.dryRun) {
    log('INFO', `Dry Run: Würde Datei hochladen: ${filePath}`);
    return true;
  }

  const stats = fs.statSync(filePath);

  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
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
function processFiles(dir, baseDir = '', config) {
  result = { ok: 0, failed: 0 }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.join(baseDir, entry.name);

    if (entry.isDirectory()) {
      const r = processFiles(fullPath, relativePath, config);
      result.ok += r.ok;
      result.failed += r.failed;
    } else {
      const success = uploadFile(fullPath, baseDir, config);
      if (success) {
        result.ok++;
      } else {
        result.failed++;
      }

      if (success && config.deleteSourceFile) {
        if (config.dryRun) {
          log('INFO', `Dry Run: Würde Datei löschen: ${fullPath}`);
        } else {
          fs.unlinkSync(fullPath);
          log('INFO', `Datei gelöscht: ${fullPath}`);
        }
      }
    }
  }

  return result;
}

// Hauptprogramm: Steuerung durch Cron-Job
function startProcess() {
  if (isRunning) {
    log('WARN', 'Übertragung läuft bereits, neue Übertragung wird ausgesetzt.');
    return;
  }

  isRunning = true;
  try {
    // Config einlesen
    const sourcePath = path.resolve(config.sourcePath);

    log('INFO', 'Übertragung gestartet.');
    const result = processFiles(sourcePath, '', config);
    log('INFO', `Übertragung abgeschlossen. ${JSON.stringify(result)}`);
  } catch (err) {
    log('ERROR', `Fehler während der Übertragung: ${err.message}`);
  } finally {
    isRunning = false;
  }
  const next = cronParser.parseExpression(config.cronSchedule).next();
  log('INFO', `Nächste Ausführung in ${getNextExecution(next)}: ${next} `);
}

function getNextExecution(cronDate) {
  const nextExecution = cronDate.toDate(); // Konvertiere in ein Date-Objekt
  const now = new Date();

  const durationMs = nextExecution - now; // Differenz in Millisekunden

  const humanReadableDuration = humanizeDuration(durationMs, {
    largest: 3, // Zeige maximal 3 Zeiteinheiten
    round: true, // Runde die Werte
  });
  return humanReadableDuration;
}


// Cron-Job einrichten
function setupCronJob() {
  const cronSchedule = config.cronSchedule;

  const next = cronParser.parseExpression(config.cronSchedule).next();
  log('INFO', `Nächste Ausführung in ${getNextExecution(next)}: ${next} `);

  cron.schedule(cronSchedule, startProcess);
  log('INFO', `Cron-Job mit Zeitplan "${cronSchedule}" gestartet.`);
}

// Initialisierung
try {
  setupCronJob();
} catch (err) {
  log('ERROR', `Fehler beim Starten des Clients: ${err.message}`);
}

