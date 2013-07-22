#!/usr/bin/env node

var inspect = require('util').inspect;

var file = process.argv[2];

if (! file) {
  console.error('Need file as first arg');
  process.exit(1);
}

var fs = require('fs');
var rs = fs.createReadStream(file);
var parse = require('./parse')();

parse.on('data', onFileData);
parse.once('end', onFileEnd);

rs.pipe(parse);

var datas = [];
function onFileData(d) {
  datas.push(d);
}

var combine = require('./combine');

function onFileEnd() {
  var fixeds = [
    "chunkSize",
    "highWaterMark",
    "maxConcurrentBatches",
    "timeoutBetweenChunks",
    "valueSize"
  ];

  var plots = combine(datas, fixeds, "ellapsed", 'wrap');

  process.stdout.write(JSON.stringify(plots, {depth: null}));

}