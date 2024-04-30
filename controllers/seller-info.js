const fs = require('fs').promises;

async function readFileIntoArray(filePath) {
  const data = await fs.readFile(filePath, 'utf-8');
  return data.split('\n');
}

module.exports = readFileIntoArray;
