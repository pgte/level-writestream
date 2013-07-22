var extend = require('util')._extend;
var inspect = require('util').inspect;
var _ = require('underscore');

module.exports = combine;

function combine(datas, fixeds, resultName, distinctor) {

  var uniqueValues = {};
  datas.forEach(extractUnique);
  var res = _.flatten(fixeds.map(vary));
  return res.map(plot);

  function plot(directive) {
    var label = directive.fixed;
    var yLabel = directive.varies;
    var xLabel = resultName;
    var points = scan(directive.fixed, directive.varies);

    return {
      label: label,
      yLabel: yLabel,
      xLabel: xLabel,
      points: points
    };
  }

  function scan(fixeds, varies) {
    var ret = datas.filter(function(d) {
      var good = true;
      Object.keys(fixeds).forEach(function(fixedVar) {
        if (d[fixedVar] != fixeds[fixedVar]) good = false;
      });
      return good;
    }).map(function(d) {
      var ret = {x: d[varies], y: d[resultName]};
      ret[distinctor] = d[distinctor];
      return ret;
    });

    var xs = {};
    ret.forEach(function(data) {
      var value = data[distinctor].toString();
      var dest = xs[value];
      if (! dest) dest = xs[value] = [];
      delete data[distinctor];
      dest.push(data);
    });

    return xs;
  }

  function extractUnique(data) {
    fixeds.forEach(function(fixed) {
      var values = uniqueValues[fixed];
      if (! values) values = uniqueValues[fixed] = [];
      var val = data[fixed];
      if (val !== undefined) {
        if (values.indexOf(val) < 0) values.push(val);
      }
      values.sort();
    });
  }

  function vary(varName) {
    var fixingVarNames = fixeds.filter(exclude(varName));

    var combs = combinations(fixingVarNames);
    return combs.map(function(oneComb) {
      return {fixed: oneComb, varies: varName, values: uniqueValues[varName]};
    });

    function combinations(fixedVars) {

      var ret = [];

      fixedVars.forEach(function(fixedVar) {
        ret = multiply(ret, oneCombination(fixedVar));
      });

      return ret;

    }

    function oneCombination(_var) {
      var values = uniqueValues[_var];
      return values.map(function(value) {
        var ret = {};
        ret[_var] = value;
        return ret;
      });
    }


  }
}

function exclude(a) {
  return function(o) {
    return o != a;
  }
}

function multiply(sources, dimensionValues) {
  if (! sources.length) return dimensionValues;
  var ret = [];
  dimensionValues.forEach(function(dimValue) {
    sources.forEach(function(source) {
      var o = clone(source);
      extend(o, dimValue);
      ret.push(o);
    })
  });

  return ret;
}

function clone(o) {
  return extend({}, o);
}