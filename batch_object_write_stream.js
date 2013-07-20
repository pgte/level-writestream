module.exports = BatchObjectWriteStream;
BatchObjectWriteStream.WritableState = WritableState;

var util = require('util');
var assert = require('assert');
var Stream = require('stream');

util.inherits(BatchObjectWriteStream, Stream);

function WriteReq(chunk, cb) {
  this.chunk = chunk;
  this.callback = cb;
}

function WritableState(options, stream) {
  options = options || {};

  this.maxSize = options.maxSize || 50;

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  var hwm = options.highWaterMark;
  this.highWaterMark = (hwm || hwm === 0) ? hwm : 100;

  // cast to ints.
  this.highWaterMark = ~~this.highWaterMark;

  if (this.highWaterMark <= this.maxSize)
    throw new Error('maxSize (' + this.maxSize + ') ' +
      'is bigger than highWaterMark (' + this.highWaterMark + ')');

  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, becuase any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function(er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;

  this.buffer = [];
}

function BatchObjectWriteStream(options) {
  if (!(this instanceof BatchObjectWriteStream) && !(this instanceof Stream.Duplex))
    return new BatchObjectWriteStream(options);

  this._writableState = new WritableState(options, this);

  // legacy.
  this.writable = true;

  Stream.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
BatchObjectWriteStream.prototype.pipe = function() {
  this.emit('error', new Error('Cannot pipe. Not readable.'));
};


function writeAfterEnd(stream, state, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  process.nextTick(function() {
    cb(er);
  });
}

BatchObjectWriteStream.prototype.write = function(chunk, cb) {
  var state = this._writableState;
  var ret = false;

  if (typeof cb !== 'function')
    cb = function() {};

  if (state.ended)
    writeAfterEnd(this, state, cb);
  else ret = writeOrBuffer(this, state, chunk, cb);

  return ret;
};

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, chunk, cb) {
  state.length += 1;

  var ret = state.length < state.highWaterMark;
  state.needDrain = !ret;

  state.buffer.push(new WriteReq(chunk, cb));
  maybeFlush(stream, state);
  return ret;
}

function maybeFlush(stream, state) {
  if (! state.writing && state.length >= state.maxSize || state.ending) {
    flush(stream, state);
  } else if (! state.nextTick) {
    state.nextTick = function() {
      flush(stream, state);
    };
    process.nextTick(state.nextTick);
  }
}

function flush(stream, state) {
  state.nextTick = false;
  var buffer = state.buffer;
  if (! state.writing && buffer.length) {
    state.buffer = [];
    doWrite(stream, state, buffer);
  }
}

function doWrite(stream, state, buffer) {
  var batch = buffer.map(extractChunkFromWriteReq);
  var cbs = buffer.map(extractCbFromWriteReq);
  state.writecb = function(err) {
    cbs.forEach(callIfExists);
  }
  state.writelen = batch.length;
  state.writing = true;
  state.sync = true;
  stream._writeBatch(batch, state.onwrite);
  state.sync = false;
}

function callIfExists(cb) {
  if (cb) cb();
}

function extractChunkFromWriteReq(writeReq) {
  return writeReq.chunk;
}

function extractCbFromWriteReq(writeReq) {
  return writeReq.cb;
}

function onwriteError(stream, state, sync, er, cb) {
  if (sync)
    process.nextTick(function() {
      cb(er);
    });
  else
    cb(er);

  stream.emit('error', er);
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;

  onwriteStateUpdate(state);

  if (er)
    onwriteError(stream, state, sync, er, cb);
  else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(stream, state);

    if (!finished && state.buffer.length)
      flush(stream, state);

    if (sync) {
      process.nextTick(function() {
        afterWrite(stream, state, finished, cb);
      });
    } else {
      afterWrite(stream, state, finished, cb);
    }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished)
    onwriteDrain(stream, state);
  cb();
  if (finished)
    finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}


// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;

  flush(stream, state);

  state.bufferProcessing = false;
}

BatchObjectWriteStream.prototype._writeBatch = function(batch, cb) {
  cb(new Error('not implemented'));
};

BatchObjectWriteStream.prototype.end = function(chunk, cb) {
  var state = this._writableState;

  if (typeof chunk !== 'undefined' && chunk !== null)
    this.write(chunk);

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished)
    endWritable(this, state, cb);
};


function needFinish(stream, state) {
  return (state.ending &&
          state.length === 0 &&
          !state.finished &&
          !state.writing);
}

function finishMaybe(stream, state) {
  var need = needFinish(stream, state);
  if (need) {
    state.finished = true;
    stream.emit('finish');
  }
  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  flush(stream, state);
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished)
      process.nextTick(cb);
    else
      stream.once('finish', cb);
  }
  state.ended = true;
}
