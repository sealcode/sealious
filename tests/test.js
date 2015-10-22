var requireDir = require("require-dir");
var fs = require("fs");
var path = require("path");

try{
	fs.unlinkSync(path.resolve(module.filename, "../../db/resources"));	
}catch(e){
	console.log("Did not found `db/resources` file")
}

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
