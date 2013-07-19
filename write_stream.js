var Writable = require('stream').Writable;
var inherits = require('util').inherits;

module.exports =
function createWriteStream(options) {
  return new WriteStream(this, options);
};

function WriteStream(db, options) {
  Writable.call(this, {objectMode: true});

  this.db = db;
}

inherits(WriteStream, Writable);

WriteStream.prototype._write = function _write(chunk, encoding, cb) {
  this.db.put(chunk.key, chunk.value, cb);
};