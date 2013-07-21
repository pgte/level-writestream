var fs = require('fs');
var level = require('level');

var max = Number(process.argv[2]);
var chunks = Number(process.argv[3]);
var highWaterMark = Number(process.argv[4]);
var maxConcurrentBatches = Number(process.argv[5]);
var wrap = process.argv[6] == 'true';

console.log('conf:', {
  max: max,
  chunks: chunks,
  highWaterMark: highWaterMark,
  maxConcurrentBatches: maxConcurrentBatches,
  wrap: wrap
});

var dir = __dirname + '/db';

if (fs.existsSync(dir)) {
  fs.readdirSync(dir).forEach(remove);
}

function remove(file) {
  fs.unlinkSync(dir + '/' + file);
}

var db = level(dir, {createIfMissing: true});

if (wrap) {
  var WriteStream = require('../..');
  WriteStream(db);
}

/// create read stream

var rs = new (require('stream').PassThrough)({objectMode: true});

/// cretae write stream

var ws = db.createWriteStream({
  highWaterMark: highWaterMark,
  maxBufferLength: highWaterMark,
  maxConcurrentBatches: maxConcurrentBatches
});

/// pipe

rs.pipe(ws);

/// start timer

var key = 0;

var start = Date.now();

ws.once('close', function() {
  var end = Date.now();
  var ellapsed = end - start;
  console.log('wrote %d records in %d ms', key, ellapsed);
});


/// feed

function writeSome() {
  if (key < max) {
    write(chunks);
    setTimeout(writeSome, 10);
  } else rs.end();
}

writeSome();

function write(n) {
  for(var i = 0; i < n; i ++) {
    key ++;
    rs.write({key: key.toString(), value: 'v' + key});
  }
}
