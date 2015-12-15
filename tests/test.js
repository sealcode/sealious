var Sealious = require("sealious");
var requireDir = require("require-dir");
var Mocha = require('mocha');
var fs = require('fs');
var path = require('path');

// Instantiate a Mocha instance.
var mocha = new Mocha();
mocha.delay();

var testDir = path.resolve(module.filename, '../unit-tests')

// Add each .js file to the mocha instance
fs.readdirSync(testDir).filter(function(file){
    // Only keep the .js files
    return file.substr(-3) === '.js';

}).forEach(function(file){
    mocha.addFile(
        path.join(testDir, file)
    );
});

try{
    fs.unlinkSync(path.resolve(module.filename, "../../db/resources")); 
}catch(e){
    console.log("Did not found `db/resources` file")
}

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

// Run the tests.
mocha.run(function(failures){
  process.on('exit', function () {
    process.exit(failures);
  });
});