/**
 * Given a string of javascript code, find global
 * variables and replace instances of them and their
 * corresponding properties, specified in 'options.replacements'
 */

var findGlobals = require('./find-globals');

module.exports = function replacer (source, options) {
  var replacements = options.replacements || {};
  var sourceRef = source.split('');
  each(replacements, function (to, from) {
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

  var globalNode = find(globals, function (global) {
    return global.name === fromParts[0];
  });
  if (!globalNode || !globalNode.nodes) {
    return sourceRef;
  }

  // if first part changed e.g. (window -> _window) or (window.location -> _window.location)
  if (fromParts[0] !== toParts[0]) {
    if (fromParts.length === 1) {
      return replaceNodeStrings(sourceRef, globalNode.nodes, toParts[0]);
    }
    // only replace the globals that have specified property too
    var globalsWithCorrectProperty = globalNode.nodes.filter(function (node) {
      var propertyString = sourceRef.slice(node.end, node.end + fromParts[1].length + 1).join('');
      return propertyString === ('.' + fromParts[1]);
    });
    sourceRef = replaceNodeStrings(sourceRef, globalsWithCorrectProperty, toParts[0]);
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
  (nodes || []).forEach(function (node) {
    var prevLength = sourceRef.length;
    sourceRef = replaceString(sourceRef, newStr, node.start + offset, node.end + offset);
    offset += (sourceRef.length - prevLength);
  });
  return sourceRef;
}

function getPropertyNodes (globalNode, propertyName) {
  var properties = (globalNode.properties || []).filter(function (property) {
    return property.name === propertyName;
  });
  var hiddenNodes = (globalNode.passedNodes || []).filter(function (passedNode) {
    return passedNode.property && passedNode.property.name === propertyName;
  }).map(function (passedNode) {
    return passedNode.property;
  });
  return properties.concat(hiddenNodes).sort(function (a, b) {
    return a.start - b.start;
  });
}

function replaceString (sourceRef, newStr, start, end) {
  return sourceRef.slice(0, start).concat(newStr.split(''), sourceRef.slice(end));
}

function each (obj, iterator) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      iterator(obj[key], key);
    }
  }
}

function find (list, predicate) {
  for (var i = 0, value; i < list.length; i++) {
    value = list[i];
    if (predicate(value, i, list)) return value;
  }
  return undefined;
}
