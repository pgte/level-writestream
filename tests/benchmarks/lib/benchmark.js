var fs = require('fs');
var level = require('level');

var max = Number(process.argv[2]);
var chunks = Number(process.argv[3]);
var highWaterMark = Number(process.argv[4]);
var maxConcurrentBatches = Number(process.argv[5]);
var timeoutBetweenChunks = Number(process.argv[6])
var valueSize = Number(process.argv[7])
var wrap = process.argv[8] == 'true';

var conf = {
  max: max,
  chunkSize: chunks,
  highWaterMark: highWaterMark,
  maxConcurrentBatches: maxConcurrentBatches,
  timeoutBetweenChunks: timeoutBetweenChunks,
  valueSize: valueSize,
  wrap: wrap
};

// value

var value = '';
for (var i = 0 ; i < valueSize; i ++) {
  value += 'A';
}

var dir = __dirname + '/db';

if (fs.existsSync(dir)) {
  fs.readdirSync(dir).forEach(remove);
}

function remove(file) {
  fs.unlinkSync(dir + '/' + file);
}

var db = level(dir, {createIfMissing: true});

if (wrap) {
  var WriteStream = require('../../..');
  WriteStream(db);
}

/// create read stream

//var rs = new (require('stream').PassThrough)({objectMode: true});

/// cretae write stream

var ws = db.createWriteStream({
  highWaterMark: highWaterMark,
  maxBufferLength: highWaterMark,
  maxConcurrentBatches: maxConcurrentBatches
});

/// pipe

//rs.pipe(ws);

/// start timer

var key = 0;

var start = Date.now();

ws.once('close', function() {
  var end = Date.now();
  var ellapsed = end - start;
  conf.ellapsed = ellapsed;
  console.log(JSON.stringify(conf));
});


/// feed

function writeSome() {
  if (key < max) {
    write(chunks);
    setTimeout(writeSome, 10);
  } else ws.end();
}

writeSome();

function write(n) {
  for(var i = 0; i < n; i ++) {
    key ++;
    ws.write({key: key.toString(), value: value});
  }
}
