
module.exports.log = log;
// Logging-Funktion
function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    fsSync.appendFileSync('./server.log', logMessage);
    console.log(logMessage.trim());
  }