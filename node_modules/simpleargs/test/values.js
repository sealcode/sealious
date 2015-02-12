
var simpleargs = require('../');

simpleargs.clear();

exports['process undefined values'] = function (test) {    
    var options = simpleargs(['hello', '-p', '4000', '--host', 'mydomain']);

    test.ok(options);
    test.equal(options.p, 4000);
    test.equal(options.host, 'mydomain');
    test.ok(options._);
    test.ok(Array.isArray(options._));
    test.equal(options._.length, 1);
    test.equal(options._[0], 'hello');
}

exports['process integer values'] = function (test) {    
    var options = simpleargs(['-p', '4000', '--host', 'mydomain']);

    test.ok(options);
    test.strictEqual(options.p, 4000);
    test.equal(options.host, 'mydomain');
}

exports['process values'] = function (test) {    
    simpleargs.define('p','port',3000,'Port number')
        .define('h','host','localhost', 'Host name/address');

    var options = simpleargs(['hello', '-p', '4000', '--host', 'mydomain']);

    test.ok(options);
    test.equal(options.port, 4000);
    test.equal(options.host, 'mydomain');
    test.ok(options._);
    test.ok(Array.isArray(options._));
    test.equal(options._.length, 1);
    test.equal(options._[0], 'hello');
}

