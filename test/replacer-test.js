/* globals describe, it */

var chai = require('chai');
var expect = chai.expect;
var replacer = require('../lib/replacer');

describe('Global replacer', function () {
  it('should replace a simple global', function () {
    var s = replacer('window.blah = 1;', {
      replacements: {
        'window': '_window'
      }
    });
    expect(s).to.be.eql('_window.blah = 1;');
  });

  it('should replace multiple instances of a simple global', function () {
    var s = replacer('window.blah || window.hello;\nwindow.location.href;', {
      replacements: {
        'window': '_window'
      }
    });
    expect(s).to.be.eql('_window.blah || _window.hello;\n_window.location.href;');
  });

  it('should replace global properties', function () {
    var s = replacer('window.location.href;', {
      replacements: {
        'window.location': 'window._l_ocation'
      }
    });
    expect(s).to.be.eql('window._l_ocation.href;');
  });

  it('should replace multiple global properties', function () {
    var s = replacer('' +
      'window.location.href;\n' +
      'window.location.reload(true);\n' +
      'window.location.protocol;', {
      replacements: {
        'window.location': 'window._l_ocation'
      }
    });
    expect(s).to.be.eql('' +
      'window._l_ocation.href;\n' +
      'window._l_ocation.reload(true);\n' +
      'window._l_ocation.protocol;'
    );
  });

  it('should replace multiple unique globals on the same line', function () {

  });

  it('should handle multiple global replacements', function () {

  });

  it('should handle multiple global and property replacements', function () {

  });

  it('should replace properties on passed global variables', function () {
    var s = replacer('(function (w) {\n  w.location.href = "www.howaboutthat.com";\n}) (window);', {
      replacements: {
        'window.location': 'window._l_ocation'
      }
    });
    expect(s).to.be.eql('(function (w) {\n  w._l_ocation.href = "www.howaboutthat.com";\n}) (window);');
  });

  /**
   * TODO specific cases for such cases:
   * - global
   * - (true || global) and further
   * - var x = global.property;
   */
});
