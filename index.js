var createWriteStream = require('./write_stream').create;

module.exports =
function attachConstructor(db) {
  db.createWriteStream = createWriteStream;
  return db;
};
