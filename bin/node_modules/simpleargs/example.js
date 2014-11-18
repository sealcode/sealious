var simpleargs = require('./lib/simpleargs');

var argv = simpleargs(process.argv.slice(2));
console.dir(argv);
