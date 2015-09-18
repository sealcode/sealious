var package_json = require('../../package.json');
var fs = require("fs");
var child_process = require('child_process');

package_json.main = "./lib-cov/main.js";

fs.writeFile('../../package.json', JSON.stringify(package_json, null, "\t"), function(err){
    if (err) {
        return console.log(err);
    }
});

child_process.exec('node ../../node_modules/.bin/jscoverage ../../lib ../../lib-cov', function(err, data){
	if (err) {
		return console.log(err);
	}
	console.log(data);
});