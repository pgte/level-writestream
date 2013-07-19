var fs = require('fs');
var split = require('split');
var combine = require('stream-combiner');
var through = require('through');

module.exports =
function SourceStream(path) {
  var rs = fs.createReadStream(path);
  return combine(rs, parseStream());
};


function parseStream() {
  return combine(split('\n'), parser());
}

function parser() {
  return through(parseJSON);
}

function parseJSON(d) {
  if (d) {
    this.queue(JSON.parse(d));
  }
}