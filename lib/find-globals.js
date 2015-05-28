/**
 * Given a string of javascript code, find all occurences of
 * global variables
 *
 * Based on https://github.com/ForbesLindesay/acorn-globals
 */
var acorn = require('acorn');
var walk = require('acorn/dist/walk');

module.exports = function findGlobals (source, options) {
  var ast = parseSource(source);
  var globals = [];

  walk.ancestor(ast, {
    'VariableDeclaration': function (node, parents) {
      var parent = null;
      for (var i = parents.length - 1; i >= 0 && parent === null; i--) {
        if (node.kind === 'var' ? isScope(parents[i]) : isBlockScope(parents[i])) {
          parent = parents[i];
        }
      }
      parent.locals = parent.locals || {};
      node.declarations.forEach(function (declaration) {
        parent.locals[declaration.id.name] = true;
      });
    },
    'FunctionDeclaration': function (node, parents) {
      var parent = null;
      for (var i = parents.length - 2; i >= 0 && parent === null; i--) {
        if (isScope(parents[i])) {
          parent = parents[i];
        }
      }
      parent.locals = parent.locals || {};
      parent.locals[node.id.name] = true;
      declareFunction(node);
    },
    'Function': declareFunction,
    'TryStatement': function (node) {
      if (node.handler) {
        node.handler.body.locals = node.handler.body.locals || {};
        node.handler.body.locals[node.handler.param.name] = true;
      } else {
        // TODO: handle finally with node.finalizer ?
      }
    },
    'ImportDefaultSpecifier': function (node) {
      if (node.local.type === 'Identifier') {
        ast.locals = ast.locals || {};
        ast.locals[node.local.name] = true;
      }
    },
    'ImportSpecifier': function (node) {
      var id = node.local ? node.local : node.imported;
      if (id.type === 'Identifier') {
        ast.locals = ast.locals || {};
        ast.locals[id.name] = true;
      }
    },
    'ImportNamespaceSpecifier': function (node) {
      if (node.local.type === 'Identifier') {
        ast.locals = ast.locals || {};
        ast.locals[node.local.name] = true;
      }
    }
  });

  walk.ancestor(ast, {
    'Identifier': function (node, parents) {
      var name = node.name;
      if (name === 'undefined') return;
      for (var i = 0; i < parents.length; i++) {
        if (name === 'arguments' && declaresArguments(parents[i])) {
          return;
        }
        if (parents[i].locals && name in parents[i].locals) {
          return;
        }
      }
      node.parents = parents;
      globals.push(node);
    },
    'ThisExpression': function (node, parents) {
      for (var i = 0; i < parents.length; i++) {
        if (declaresThis(parents[i])) {
          return;
        }
      }
      node.parents = parents;
      globals.push(node);
    }
  });

  var groupedGlobals = {};
  var groupedProperties = {};
  var passedGlobals = {};

  globals.forEach(function (node) {
    groupedGlobals[node.name] = groupedGlobals[node.name] || [];
    groupedGlobals[node.name].push(node);
  });

  /**
   * Find global properties
   */
  walk.ancestor(ast, {
    'MemberExpression': function (node, parents) {
      // expression starts on a global node, so add it to
      // global property group
      if (globals.indexOf(node.object) !== -1) {
        groupedProperties[node.object.name] = groupedProperties[node.object.name] || [];
        groupedProperties[node.object.name].push(node.property);
      }
      // check if in any of the parent function calls pass in a global
      parents.forEach(function (parent) {
        if (parent.type !== 'CallExpression') {
          return;
        }
        parent.arguments.forEach(function (arg, i) {
          if (globals.indexOf(arg) === -1) {
            return;
          }
          // parent function call is passed global variable as a parameter
          if (parent.callee.type === 'FunctionExpression') {
            var param = parent.callee.params[i];
            // passed global is actually used inside function and one
            // of it's properties is accessed
            if (param && node.object.name === param.name) {
              passedGlobals[arg.name] = passedGlobals[arg.name] || [];
              passedGlobals[arg.name].push(node);
            }
          }
          if (parent.callee.type === 'MemberExpression') {
            // TODO: this is tricky
            // i.e. someFunctionElsewhere(window, var)
            // even if that function is in another file?!
          }
        });
      });
    }
  });

  return Object.keys(groupedGlobals).sort().map(function (name) {
    return {
      name: name,
      nodes: groupedGlobals[name],
      properties: groupedProperties[name],
      passedNodes: passedGlobals[name]
    };
  });
};

function parseSource (source) {
  if (typeof source !== 'string') {
    source = String(source);
  }
  var ast;
  try {
    ast = acorn.parse(source, {
      ranges: true,
      allowReturnOutsideFunction: true
    });
  } catch (e) {
    if (e.name === 'SyntaxError') {
      throw e;
    }
  }

  if (!(ast && typeof ast === 'object' && ast.type === 'Program')) {
    throw new TypeError('Source must be either a string of JavaScript or an acorn AST');
  }

  return ast;
}

function declareFunction (node) {
  var fn = node;
  fn.locals = fn.locals || {};
  node.params.forEach(function (node) {
    fn.locals[node.name] = true;
  });
  if (node.id) {
    fn.locals[node.id.name] = true;
  }
}

function declaresArguments (node) {
  return node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration' || node.type === 'ArrowFunction';
}

function declaresThis (node) {
  return node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration';
}

function isScope (node) {
  return node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration' || node.type === 'Program';
}

function isBlockScope (node) {
  return node.type === 'BlockStatement' || isScope(node);
}
