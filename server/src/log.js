const fs = require('fs');

const LOG_PATH = './server.log';

const log = function (prio, ...message) {
  return log._log(prio, message);
};

log._log = (prio, message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${prio}] ${message.join(', ')}\n`;
  fs.appendFileSync(LOG_PATH, logMessage);
  console.log(logMessage.trim());
}

log.race = (...message) => log._log('TRACE', message);
log.debug = (...message) => log._log('DEBUG', message);
log.info = (...message) => log._log('INFO', message);
log.warn = (...message) => log._log('WARN', message);
log.error = (...message) => log._log('ERROR', message);
log.err = (...message) => log._log('ERROR', message);
log.fatal = (...message) => log._log('FATAL', message);

module.exports = { log };