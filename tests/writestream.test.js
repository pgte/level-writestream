var test = require('tap').test;
var level = require('level');
var fs = require('fs');

var LevelWritestream = require('../');
var sourceStream = require('./source_stream');

var dir = __dirname + '/db';
var db;
var ws;

test('removes the db dir', function(t) {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach(remove);
  }

  t.end();

  function remove(file) {
    fs.unlinkSync(dir + '/' + file);
  }
});

test('create db', function(t) {
  db = level(dir, {createIfMissing: true});
  LevelWritestream(db);

  db.once('ready', t.end.bind(t));
});

test('gets a put write stream', function(t) {
  ws = db.createWriteStream();
  var rs = sourceStream(__dirname + '/fixtures/puts.json');

  rs.pipe(ws);

  ws.once('finish', t.end.bind(t));
});

test('all data is there', function(t) {
  var rs = db.createReadStream();
  rs.on('data', onData);
  rs.on('end', onEnd);

  var i = -1;
  function onData(d) {
    i ++;
    var key = pad(i);
    t.deepEqual(d.key, key);

    var value = 'v' + key;
    t.deepEqual(d.value, value);
  }

  function onEnd() {
    t.equal(i, 9999);
    t.end();
  }
});

xtest('gets a put write stream', function(t) {
  ws = db.createWriteStream();
  var rs = sourceStream(__dirname + '/fixtures/puts.json');

  rs.pipe(ws);

  ws.once('finish', t.end.bind(t));
});

test('close db', function(t) {
  db.close(t.end.bind(t));
});

function xtest() {}

function pad(n) {
  var s = n.toString();

  if (n < 10) s = '0' + s;
  if (n < 100) s = '0' + s;
  if (n < 1000) s = '0' + s;
  if (n < 10000) s = '0' + s;

  return s;
}