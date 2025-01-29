const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const cron = require('node-cron');
const cronParser = require('cron-parser');
const humanizeDuration = require('humanize-duration');

const { log } = require('./log.js')

const timeout = 5000; // TODO put in confiug

// Status-Flag, um parallele Übertragungen zu vermeiden
let isRunning = false;

const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

if (!cron.validate(config.cronSchedule)) {
  log.error('Ungültiger Cron-String in der config.json.');
  return;
}

// Funktion zum Hochladen einer Datei
async function uploadFile(filePath, relativePath, config) {
  if (config.dryRun) {
    log.info(`Dry Run: Würde Datei hochladen: ${filePath}`);
    return true;
  }

  const stats = fs.statSync(filePath);

  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  form.append('relativePath', relativePath.replace(/\\/g, '/'));
  form.append('createdAt', stats.birthtime.toISOString());
  form.append('modifiedAt', stats.mtime.toISOString());

  const headers = form.getHeaders();
  try {
    const response = await axios.post(config.serverUrl, form, { headers, timeout });
    if (response. status === 200) {
      log.info(`Erfolg: '${filePath}' wurde hochgeladen`);
      return true;
    } else {
      log.error(`Fehler beim Hochladen von '${filePath}'`, `status: ${response.status}`, `msg: '${response.statusText}'`);
    }
  } catch (err) {
    log.error(`Fehler beim Hochladen von '${filePath}'`, `msg: '${err.message}'`, err.errors);
  }
  return false;
}

// Funktion zum Verarbeiten von Dateien
async function processFiles(dir, baseDir = '', config) {
  result = { ok: 0, failed: 0 }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.join(baseDir, entry.name);

    if (entry.isDirectory()) {
      const r = await processFiles(fullPath, relativePath, config);
      result.ok += r.ok;
      result.failed += r.failed;
    } else {
      const success = await uploadFile(fullPath, baseDir, config);
      if (success) {
        result.ok++;
      } else {
        result.failed++;
      }

      if (success && config.deleteSourceFile) {
        if (config.dryRun) {
          log.info(`Dry Run: Würde Datei löschen: ${fullPath}`);
        } else {
          fs.unlinkSync(fullPath);
          log.info(`Datei gelöscht: ${fullPath}`);
        }
      }
    }
  }

  return result;
}

// Hauptprogramm: Steuerung durch Cron-Job
function startProcess() {
  if (isRunning) {
    log.warn(warn, 'Übertragung läuft bereits, neue Übertragung wird ausgesetzt.');
    return;
  }

  isRunning = true;
  try {
    // Config einlesen
    const sourcePath = path.resolve(config.sourcePath);

    log.info('Übertragung gestartet.');
    const result = processFiles(sourcePath, '', config);
    log.info(`Übertragung abgeschlossen. ${JSON.stringify(result)}`);
  } catch (err) {
    log.info(`Fehler während der Übertragung: ${err.message}`);
  } finally {
    isRunning = false;
  }
  const next = cronParser.parseExpression(config.cronSchedule).next();
  log.info(`Nächste Ausführung in ${getNextExecution(next)}: ${next} `);
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
  log.info(`Nächste Ausführung in ${getNextExecution(next)}: ${next} `);

  cron.schedule(cronSchedule, startProcess);
  log.info(`Cron-Job mit Zeitplan "${cronSchedule}" gestartet.`);
}

// Initialisierung
try {
  setupCronJob();
} catch (err) {
  log.error(`Fehler beim Starten des Clients: ${err.message}`);
}

