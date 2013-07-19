var createWriteStream = require('./write_stream');

module.exports =
function attachConstructor(db) {
  db.createWriteStream = createWriteStream;
};