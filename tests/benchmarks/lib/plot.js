#!/usr/bin/env node

var fs = require('fs');

var template = fs.readFileSync(__dirname + '/../assets/template.html', 'utf8');
var mustache = require('mustache');
var data = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

var i = 0;

data.forEach(function(d) {
  i ++;
  d.id = 'chart-' + i;
  var series = Object.keys(d.points);
  var main = series.map(function(serie) {
    return {
      wrapped: serie,
      className: "." + serie,
      data: d.points[serie]
    };
  });

  var data = {
    "xScale": "linear",
    "yScale": "linear",
    "main": main
  };
  if (data.main && data.main.length)
    data.labels = data.main[0].data.map(function(d) { return {x: d.x}; });

  d.data = data;
  d.JSONData = JSON.stringify(data);
  d.label = Object.keys(d.label).map(function(label) {
    return {key: label, value: d.label[label]};
  });

  // console.log('data.label:', data.label);
});

var rendered = mustache.render(template, {charts: data});

process.stdout.write(rendered);