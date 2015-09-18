var package_json = require('../../package.json');
var fs = require("fs");

package_json.main = "./lib/main.js";

fs.writeFile('../../package.json', JSON.stringify(package_json, null, "\t"), function(err){
    if (err) {
        return console.log(err);
    }
});