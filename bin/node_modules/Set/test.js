var Set = require('./set.js');

var alpha = new Set([ 'a', 'b', 'c' ]);
var beta = new Set(function contains(val) { return val > 0; });

console.log(alpha.size());

console.log(alpha.toString());

alpha.add('d');

console.log(alpha.toString());

alpha.add('e', 'f', 'g');

console.log(alpha.toString());

alpha.remove('f', 'b');

console.log(alpha.toString());

console.log(alpha.size());

console.log(alpha.contains('a'));

console.log(alpha.contains('f'));

console.log(alpha.toArray());

console.log(alpha['*values']());
