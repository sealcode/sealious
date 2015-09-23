var requireDir = require("require-dir");
var fs = require("fs");
var path = require("path");

var Sealious = require("sealious"); 

var tests = requireDir("./unit-tests");

Sealious.init();

for(var i in tests){
	tests[i].test_init && tests[i].test_init();
}

Sealious.start().then(function(){
	for(var i in tests){
		tests[i].test_start && tests[i].test_start();
	}
	run();	
})
