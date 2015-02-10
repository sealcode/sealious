/*
 * Qt+WebKit powered headless test runner using Phantomjs
 *
 * Phantomjs installation: http://code.google.com/p/phantomjs/wiki/BuildInstructions
 *
 * Run with:
 *  phantomjs runner.js [url-of-your-qunit-testsuite]
 *
 * E.g.
 *      phantomjs runner.js http://localhost/qunit/test
 */

/*jshint latedef:false */
/*global phantom:true require:true console:true */
var url = phantom.args[0],
    threshold = phantom.args[1],
    page = require('webpage').create();

// Route "console.log()" calls from within the Page context to the main Phantom context (i.e. current "this")
page.onConsoleMessage = function(msg) {
    console.log(msg);
};

page.onInitialized = function() {
    page.injectJs('travisCov.js');
    
};

page.open(url, function(status){
    if (status !== "success") {
        console.log("Unable to access network: " + status);
        phantom.exit(1);
    } else {
        var interval = setInterval(function() {
            if (finished()) {
                clearInterval(interval);
                onfinishedTests();
            }
        }, 500);
    }
});

function finished() {
    return page.evaluate(function(){
        var m = document.getElementById("mocha"),
            ms = document.getElementById("mocha-stats");

        return m && ms;
    });
}

function onfinishedTests() {
    var output = page.evaluate(function(threshold) {
            //print a success message
            var retval=0;
            if (!window.travisCov.check(window._$blanket,{threshold: threshold})){
                    retval=1;
            }
            return retval;
                    
    });
    phantom.exit(output > 0 ? 1 : 0);
}
