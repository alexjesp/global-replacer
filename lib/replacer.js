/**
 * Given a string of javascript code, find global
 * variables and replace instances of them and their
 * corresponding properties, specified in 'options.replacements'
 */

var _ = require('lodash');
var findGlobals = require('./find-globals');

module.exports = function replacer (source, options) {
  var replacements = options.replacements || {};
  var sourceRef = source.split('');
  _.each(replacements, function (to, from) {
    var globals = findGlobals(sourceRef.join(''), options);
    sourceRef = replaceGlobal(sourceRef, globals, from, to, options);
  });
  return sourceRef.join('');
};

function replaceGlobal (sourceRef, globals, from, to, replacerOptions) {
  var fromParts = from.split('.');
  var toParts = to.split('.');

  // e.g. window.location (2) -> window.__location.href (3)
  if (fromParts.length !== toParts.length) {
    throw new Error('Global replacer: When replacing expressions, the parts must be the same length');
  }

  // if (from -> to) replacement does nothing
  if (from === to) {
    return sourceRef;
  }

  var globalNode = _.find(globals, {name: fromParts[0]});
  if (!globalNode) {
    return sourceRef;
  }

  // if first part changed e.g. (window -> _window) or (window.location -> _window.location)
  if (fromParts[0] !== toParts[0]) {
    if (fromParts.length === 1) {
      return replaceNodeStrings(sourceRef, globalNode.nodes, toParts[0]);
    }
    // only replace the globals that have specified property too
    var globalsThatAlsoHaveProperties = _.filter(globalNode.nodes, function (node) {
      return sourceRef[node.end] === '.';
    });
    sourceRef = replaceNodeStrings(sourceRef, globalsThatAlsoHaveProperties, toParts[0]);
    // since we have changed the global name, we need to rescan global properties e.g.
    // (window.location -> _window._l_ocation) becomes (_window.location -> _window._l_ocation)
    var newFrom = [toParts[0]].concat(fromParts.slice(1)).join('.');
    var newGlobals = findGlobals(sourceRef.join(''), replacerOptions);
    sourceRef = replaceGlobal(sourceRef, newGlobals, newFrom, to);
  } else {
    sourceRef = replaceNodeStrings(sourceRef, getPropertyNodes(globalNode, fromParts[1]), toParts[1]);
  }

  return sourceRef;
}

function replaceNodeStrings (sourceRef, nodes, newStr) {
  var offset = 0;
  _.each(nodes, function (node) {
    var prevLength = sourceRef.length;
    sourceRef = replaceString(sourceRef, newStr, node.start + offset, node.end + offset);
    offset += (sourceRef.length - prevLength);
  });
  return sourceRef;
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
  return sourceRef.slice(0, start).concat(newStr.split(''), sourceRef.slice(end));
}
