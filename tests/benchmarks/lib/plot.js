#!/usr/bin/env node

var fs = require('fs');

var template = fs.readFileSync(__dirname + '/../assets/template.html', 'utf8');
var mustache = require('mustache');
var data = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

data = data.filter(function(d) {
  return Object.keys(d.points).length >= 2;
});

var i = 0;

data.forEach(function(d) {
  var series = Object.keys(d.points);
  var main = series.map(function(serie) {
    return {
      tested: serie == 'true' ? 'level-writestream' : 'LevelUP',
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

data = data.sort(function(a, b) {
  return a.yLabel > b.yLabel ? 1 : -1 ;
});

data.forEach(function(d) {
  i ++;
  d.id = 'chart-' + i;
});

var labels = [];

var oldLabel;
data.forEach(function(d) {
  if (! oldLabel || oldLabel != d.yLabel) {
    oldLabel = d.yLabel;
    d['changesLabel?'] = [{label: oldLabel}];
    labels.push(oldLabel);
  }
});

var rendered = mustache.render(template, {charts: data, labels: labels});

process.stdout.write(rendered);