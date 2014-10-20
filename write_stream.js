var inherits = require('util').inherits;

var defaultWaterMark = 100;

var BatchWriteStream = require('batch-write-stream')
  , inherits         = require('util').inherits
  , extend           = require('xtend')
  , concatStream     = require('concat-stream')

  , setImmediate     = global.setImmediate || process.nextTick

  , defaultOptions = {
      highWaterMark: 1e5,
      maxConcurrentBatches: 4,
      type: 'put',
      flushWait: 10
    }

function WriteStream(options, db) {
  this._options = options = extend(defaultOptions, options || {})
  this._db = db
  this._type = this._options.type
  this._options = options


  this.once('finish', onFinish.bind(this))

  BatchWriteStream.call(this, {
      objectMode: true
    , highWaterMark: options.highWaterMark
    , maxConcurrentBatches: options.maxConcurrentBatches
    , flushWait: options.flushWait
  })

  ready(this)
}

inherits(WriteStream, BatchWriteStream)


function ready(stream) {
  if (stream._db.isOpen && stream._db.isOpen()) {
    setImmediate(function() {
      stream.emit('ready')
    })
  } else {
    stream._db.once('ready', function() {
      stream.emit('ready')
    })
  }
}


WriteStream.prototype._writeBatch = function _writeBatch(batch, cb) {
  this._db.batch(batch, cb)
}

WriteStream.prototype._map = function(rec) {
  return {
    type: rec.type || this._type,
    key: rec.key,
    value: rec.value,
    keyEncoding: rec.keyEncoding || this._options.keyEncoding,
    valueEncoding: rec.valueEncoding || this.encoding || this._options.valueEncoding
  }
}

WriteStream.prototype.add = function add(entry) {
  if (!entry.props)
    return
  if (entry.props.Directory)
    entry.pipe(this._db.writeStream(this._options))
  else if (entry.props.File || entry.File || entry.type == 'File')
    this.addWrite(entry)
  return true
}

WriteStream.prototype.addWrite = function addWrite(entry) {
  var key = entry.path || entry.props.path
      , self = this

    if (!key)
      return

    entry.pipe(concatStream(function (err, data) {
      if (err) {
        self.writable = false
        return self.emit('error', err)
      }

      if (self._options.fstreamRoot &&
          key.indexOf(self._options.fstreamRoot) > -1)
        key = key.substr(self._options.fstreamRoot.length + 1)

      self.write({ key: key, value: data })
    }))
}

function onFinish() {
  this.emit('close') // backwards compatibility
}

WriteStream.prototype.toString = function () {
  return 'Level-WriteStream'
}

exports.create =
function createWriteStream(options) {
  return new WriteStream(options, this)
}
