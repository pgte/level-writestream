var Writable = require('./batch_object_write_stream');
var inherits = require('util').inherits;

var defaultWaterMark = 100;

exports.create =
function createWriteStream(options) {
  return new WriteStream(this, options);
};

function WriteStream(db, options) {
  if (! options) options = {};
  Writable.call(this, {
    objectMode: true,
    highWaterMark: options.highWaterMark || defaultWaterMark,
    maxConcurrentBatches: options.maxConcurrentBatches || 4
  });

  this.db = db;
  this.type = options && options.type || 'put';

  this.once('finish', onFinish.bind(this));

  this.options = options || {};
}

inherits(WriteStream, Writable);


/// _map

WriteStream.prototype._map = function _map(d) {
  var options = this.options;
  var key = d.key;
  if (options.fstreamRoot &&
      key.indexOf(options.fstreamRoot) > -1)
    d.key = key = key.substr(options.fstreamRoot.length + 1);

  return d;
};


/// _write

WriteStream.prototype._writeBatch = function _writeBatch(batch, cb) {
  var self = this;
  batch = batch.map(function(rec) {
    return {
      type: rec.type || self.type,
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