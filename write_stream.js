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

  this.options = options || {};
}

inherits(WriteStream, Writable);


/// _write


WriteStream.prototype._writeBatch = function _writeBatch(batch, cb) {
  var self = this;
  console.log('writing a batch of %d', batch.length);
  batch = batch.map(function(rec) {
    return {
      type: self.type,
      key: rec.key,
      value: rec.value,
      keyEncoding: rec.keyEncoding || self.options.keyEncoding,
      valueEncoding: rec.valueEncoding || self.encoding || self.options.valueEncoding
    }
  });
  this.db.batch(batch, cb);
};

/// onFinish

function onFinish() {
  this.emit('close'); // backwards compatibility
}