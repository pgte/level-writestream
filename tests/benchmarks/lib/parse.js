var split = require('split');
var combine = require('stream-combiner');
var through = require('through');

module.exports =
function parse() {
  return combine(split('\n'), lineParse());
}

function lineParse() {
  return through(parseLine);
}

function parseLine(d) {
  if (d) {
    this.queue(JSON.parse(d));
  }
}