# level-writestream

> Streams2-compliant write stream for LevelDB

## Install

```bash
$ npm i level-writestream --save
```

(also install `level` if you haven't already:

```bash
$ npm i level --save
```
)

## Import

```javascript
var LevelWriteStream = require('level-writestream');
```

## Apply

```javascript
var db = level('/path/to/level/db/dir');
LevelWriteStream(db);
```

## Use

```javascript
var ws = db.createWriteStream();
ws.write({key: 'A', value: 'B'}, function(err) {
  if (err) throw err;
});

source.pipe(ws);

ws.once('finish', function() {
  console.log('finished');
});
```

You can use the same options as in [the LevelUP API](https://github.com/rvagg/node-levelup#createWriteStream) plus all the streams2 API conventions.

## Plain Benchmarks comparing LevelUP and Level-WriteStream

```bash
$ tests/benchmarks/old/run
```

## Complex Benchmark

```bash
$ cd tests/benchmarks
$ ./run
```

## License

MIT
