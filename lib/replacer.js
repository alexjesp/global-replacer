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

  // e.g. window.location (2) -> window._q_portal_location.href (3)
  if (fromParts.length !== toParts.length) {
    throw new Error('Global replacer: When replacing expressions, the parts must be the same length');
  }

  // if global / global property hasn't changed, do nothing
  if (from === to) {
    return sourceRef;
  }

  var globalNode = _.find(globals, {name: fromParts[0]});
  if (globalNode) {
    if (fromParts[0] !== toParts[0]) {
      replaceNodes(globalNode.nodes, toParts[0]);
    } else {
      replaceNodes(getPropertyNodes(globalNode, fromParts[1]), toParts[1]);
    }
    offset = 0;
  }

  return sourceRef;

  function replaceNodes (nodes, newStr) {
    _.each(nodes, setupReplacement(newStr));
  }

  function setupReplacement (newStr) {
    return function withNode (node) {
      var prevLength = sourceRef.length;
      sourceRef = replaceString(sourceRef, newStr, node.start + offset, node.end + offset);
      offset += (sourceRef.length - prevLength);
    };
  }
}

function getPropertyNodes (globalNode, propertyName) {
  var properties = _.where(globalNode.properties, {name: propertyName});
  var hiddenNodes = _.filter(globalNode.passedNodes, function (passedNode) {
    return passedNode.property && passedNode.property.name === propertyName;
  });
  var hiddenNodeProperties = _.pluck(hiddenNodes, 'property');
  return _.sortBy(properties.concat(hiddenNodeProperties), 'start');
}

function replaceString (sourceRef, newStr, start, end) {
  return sourceRef.slice(0, start).concat(newStr.split('')).concat(sourceRef.slice(end));
}
