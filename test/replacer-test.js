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

  it('should replace global properties', function () {
    var s = replacer('window.location.href;', {
      replacements: {
        'window.location': 'window._l_ocation'
      }
    });
    expect(s).to.be.eql('window._l_ocation.href;');
  });
});
