/**
 * Given a string of javascript code, find global
 * variables and replace instances of them and their
 * corresponding properties, specified in 'options.replacements'
 */

var _ = require('lodash');
var findGlobals = require('./find-globals');
var offset = 0;

module.exports = function replacer (source, options) {
  var globals = findGlobals(source, options);
  var sourceRef = source.split('');

  _.each(options.replacements || {}, function (to, from) {
    sourceRef = replaceGlobal(sourceRef, globals, from, to);
  });

  return sourceRef.join('');
};

function replaceGlobal (sourceRef, globals, from, to) {
  var fromParts = from.split('.');
  var toParts = to.split('.');

  var globalNode = _.find(globals, {name: fromParts[0]});
  var nodes = globalNode && globalNode.nodes;
  if (!nodes) {
    return sourceRef;
  }
  _.each(nodes, function (node) {
    sourceRef = replaceString(
      sourceRef,
      toParts[0],
      node.start + offset,
      node.end + offset
    );
    offset += toParts[0].length - fromParts[0].length;
  });
  offset = 0;
  return sourceRef;
}

function replaceString (sourceRef, newStr, start, end) {
  return sourceRef.slice(0, start).concat(newStr.split('')).concat(sourceRef.slice(end));
}
