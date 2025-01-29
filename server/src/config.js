const fs = require('fs');

const configPath = 'config.json'

if (!fs.existsSync(configPath)) {
  log('Config file not found. Please create a config.json file.', 'ERROR');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
module.exports.config = config;