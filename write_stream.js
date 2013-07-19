var Writable = require('./batch_object_write_stream');
var inherits = require('util').inherits;

var defaultWaterMark = 50;

module.exports =
function createWriteStream(options) {
  return new WriteStream(this, options);
};

function WriteStream(db, options) {
  Writable.call(this, {
    objectMode: true,
    highWaterMark: options && options.highWaterMark || defaultWaterMark });

  this.db = db;
}

inherits(WriteStream, Writable);


/// _write


WriteStream.prototype._write = function _write(chunk, cb) {
  this.db.put(chunk.key, chunk.value, cb);
};