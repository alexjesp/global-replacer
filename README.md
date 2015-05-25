Global Replacer
====

A script that replaces specified global variables and their properties in javascript code.

### Examples

#### Replacing globals

```js
var replacer = require('global-replacer');
var replacedString = replacer('var loc = window.location.href.toString();', {
  replacements: {
    'window': '_window'
  }
});
console.log(replacedString); // var loc = _window.location.href.toString();
```

#### Replacing global properties

```js
var replacer = require('global-replacer');
var replacedString = replacer('var loc = window.location.href.toString();', {
  replacements: {
    'window.location': 'window._l_o_c_ation'
  }
});
console.log(replacedString); // var loc = window._l_o_c_ation.href.toString();
```

The replacements will also work when globals are passed into functions.  
For example, with the above options:
```js
(function (w) {
  w.location.href = 'http://google.com';
})(window);
```
will become
```js
(function (w) {
  w._l_o_c_ation.href = 'http://google.com';
})(window);
```

__Notes__  
* The number of object parts must be equal to the replaced version  
i.e. `['window', 'location']` and `['window', '__location']` both have two parts
* You __cannot__ replace a global variable and one of it's properties. (To be added).
