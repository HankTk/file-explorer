const path = require('path');

module.exports = {
  WINDOW: {
    WIDTH: 1400,
    HEIGHT: 900,
    DEV_SERVER_URL: 'http://localhost:4200',
    DEV_SERVER_TIMEOUT: 2000,
    PROD_INDEX_PATH: path.join(__dirname, '..', '..', 'dist', 'file-explorer', 'index.html')
  },
  FILE_SYSTEM: {
    MAX_SEARCH_DEPTH: 10,
    HIDDEN_FILES: ['.', 'node_modules']
  }
};
