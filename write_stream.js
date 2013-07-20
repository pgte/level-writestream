var Writable = require('./batch_object_write_stream');
var inherits = require('util').inherits;

var defaultWaterMark = 100;

module.exports =
function createWriteStream(options) {
  return new WriteStream(this, options);
};

function WriteStream(db, options) {
  Writable.call(this, {
    objectMode: true,
    highWaterMark: options && options.highWaterMark || defaultWaterMark });

  this.db = db;
  this.type = options && options.type || 'put';

  this.once('finish', onFinish.bind(this));
}

inherits(WriteStream, Writable);


/// _write


WriteStream.prototype._writeBatch = function _writeBatch(batch, cb) {
  batch = batch.map(addType.bind(this));
  this.db.batch(batch, cb);
};

function addType(rec) {
  return {
    type: this.type,
    key: rec.key,
    value: rec.value
  };
}


/// onFinish

function onFinish() {
  this.emit('close'); // backwards compatibility
}