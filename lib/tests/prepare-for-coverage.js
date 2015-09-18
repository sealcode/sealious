var path = require("path");
var package_json = require('../../package.json');
var fs = require("fs");

package_json.main = "./lib-cov/main.js";

fs.writeFile(path.resolve(module.filename, '../../../package.json'), JSON.stringify(package_json, null, "\t"), function(err){
    if (err) {
        return console.log(err);
    }
});