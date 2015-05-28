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
    var s = replacer('window.location.href = document.location.href.replace(/www\\./, "subdomain");', {
      replacements: {
        'window': '_window',
        'document': '__document'
      }
    });
    expect(s).to.be.eql('_window.location.href = __document.location.href.replace(/www\\./, "subdomain");');
  });

  it('should handle multiple global replacements', function () {
    var s = replacer('window.location.href;\nlocation;', {
      replacements: {
        'window': '_window',
        'location': '_l_ocation'
      }
    });
    expect(s).to.be.eql('_window.location.href;\n_l_ocation;');
  });

  it('should handle multiple global and property replacements', function () {
    var s = replacer('' +
      'window.addEventListener();\n' +
      'location.href = "http://google.com";\n' +
      'document.location.assign(window.location.href.toString() ? "/blah" : "/hello");', {
      replacements: {
        'window': '_window',
        'location': '_l_ocation',
        'document.location': 'document._l_ocation'
      }
    });
    expect(s).to.be.eql('' +
      '_window.addEventListener();\n' +
      '_l_ocation.href = "http://google.com";\n' +
      'document._l_ocation.assign(_window.location.href.toString() ? "/blah" : "/hello");'
    );
  });

  it('should not matter which order the replacements are passed', function () {
    var s1 = replacer('window.location.href;\nlocation;', {
      replacements: {
        'window': '_window',
        'location': '_l_ocation'
      }
    });
    var s2 = replacer('window.location.href;\nlocation;', {
      replacements: {
        'location': '_l_ocation',
        'window': '_window'
      }
    });
    expect(s1).to.be.eql('_window.location.href;\n_l_ocation;');
    expect(s2).to.be.eql('_window.location.href;\n_l_ocation;');
  });

  it.skip('should handle global and it\'s property on the same line', function () {
    var s = replacer('window.addEventListener(); window.location.href;', {
      replacements: {
        'window': '_window',
        'window.location': 'window._l_ocation'
      }
    });
    expect(s).to.be.eql('_window.addEventListener(); _window._l_ocation.href;');
  });

  it('should replace properties on passed global variables', function () {
    var s = replacer('(function (w) {\n  w.location.href = "www.howaboutthat.com";\n}) (window);', {
      replacements: {
        'window.location': 'window._l_ocation'
      }
    });
    expect(s).to.be.eql('(function (w) {\n  w._l_ocation.href = "www.howaboutthat.com";\n}) (window);');
  });

  it('should ignore passed globals that aren\'t used', function () {
    var str = '(function () {\n document.addEventListener();\n}) (window);';
    var s = replacer(str, {
      replacements: {
        'window.location': 'window._l_ocation'
      }
    });
    expect(s).to.be.eql(str);
  });

  describe('replacing multiple parts', function () {
    it('should replace multiple parts of global expressions', function () {
      var s = replacer('document.location.href;', {
        replacements: {
          'document.location': 'window._l_ocation'
        }
      });
      expect(s).to.be.eql('window._l_ocation.href;');
    });

    it('shouldn\'t affect single part expressions', function () {
      var s = replacer('document.location; document;', {
        replacements: {
          'document.location': 'window._l_ocation'
        }
      });
      expect(s).to.be.eql('window._l_ocation; document;');
    });

    it('shouldn\'t replace globals for properties other than the one specified', function () {
      var s = replacer('document.location; document.styleSheets;', {
        replacements: {
          'document.location': 'window._l_ocation'
        }
      });
      expect(s).to.be.eql('window._l_ocation; document.styleSheets;');
    });
  });

  /**
   * TODO specific cases for such cases:
   * - global
   * - (true || global) and further
   * - var x = global.property;
   */
});
