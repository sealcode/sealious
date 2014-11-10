
var simpleargs = require('..');

exports['is a function'] = function (test) {
    test.ok(simpleargs);
    test.equal(typeof simpleargs, 'function');
};

