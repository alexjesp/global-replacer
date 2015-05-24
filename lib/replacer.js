/**
 * Given a string of javascript code, find global
 * variables and replace instances of them and their
 * corresponding properties, specified in 'options.replacements'
 */

var _ = require('lodash');
var findGlobals = require('./find-globals');
var offset = 0;

module.exports = function replacer (source, options) {
  var replacements = options.replacements || {};
  var sourceRef = source.split('');

  _.each(replacements, function (to, from) {
    var globals = findGlobals(sourceRef.join(''), options);
    sourceRef = replaceGlobal(sourceRef, globals, from, to);
  });

  return sourceRef.join('');
};

function replaceGlobal (sourceRef, globals, from, to) {
  var fromParts = from.split('.');
  var toParts = to.split('.');

  if ((from === to) || (fromParts.length !== toParts.length)) {
    return sourceRef;
  }

  var globalNode = _.find(globals, {name: fromParts[0]});
  if (!globalNode) {
    return sourceRef;
  }

  if (fromParts[0] !== toParts[0]) {
    _.each(globalNode.nodes || [], b(toParts[0]));
  } else {
    var properties = _.where(globalNode.properties, {name: fromParts[1]});
    _.each(properties, b(toParts[1]));
  }

  offset = 0;
  return sourceRef;

  function b (newStr) {
    return function withNode(node) {
      var prevLength = sourceRef.length;
      sourceRef = replaceString(sourceRef, newStr, node.start + offset, node.end + offset);
      offset += (sourceRef.length - prevLength);
    };
  }
}

function replaceString (sourceRef, newStr, start, end) {
  return sourceRef.slice(0, start).concat(newStr.split('')).concat(sourceRef.slice(end));
}
