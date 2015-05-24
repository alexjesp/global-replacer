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
  var nodes = globalNode && globalNode.nodes;
  if (!nodes) {
    return sourceRef;
  }

  from = fromParts[0];
  to = toParts[0];
  var isProperty = (from === to);
  if (isProperty) {
    from = fromParts[1];
    to = toParts[1];
  }

  // TODO log 'n occurences of being replaced'

  _.each(nodes, function (node) {
    if (isProperty) {
      node = getPropertyNode(node, from);
      if (!node) {
        return;
      }
    }
    var prevLength = sourceRef.length;
    sourceRef = replaceString(sourceRef, to, node.start + offset, node.end + offset);
    offset += (sourceRef.length - prevLength);
  });

  offset = 0;
  return sourceRef;
}

function getPropertyNode (node, propertyName) {
  if (!node.parents) return;
  if (node.parents.length > 1) {
    var parentNode = node.parents[node.parents.length - 2];
    if (parentNode.type === 'MemberExpression') {
      if (parentNode.property.name === propertyName) {
        return parentNode.property;
      }
    }
    if (parentNode.type === 'CallExpression') {
      var body = parentNode.callee.body;
      if (body.type === 'BlockStatement') {
        _.each(body.body, function (bodyNode) {

        });
      }
    }
  }
}

function replaceString (sourceRef, newStr, start, end) {
  return sourceRef.slice(0, start).concat(newStr.split('')).concat(sourceRef.slice(end));
}
