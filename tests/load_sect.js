// Nạp DV_DATA.sect trong node: node -e "console.log(require('./tests/load_sect.js').validate())"
global.window = global; require('../data/sect.js'); module.exports = global.DV_DATA.sect;
