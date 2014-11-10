
var simpleargs = require('../');

simpleargs.clear();

exports['get defaults'] = function (test) {    
    simpleargs.define('p','port',3000,'Port number');
    simpleargs.define('h','host','localhost', 'Host name/address');

    var options = simpleargs([]);

    test.ok(options);
    test.equal(options.port, 3000);
    test.equal(options.host, 'localhost');
}