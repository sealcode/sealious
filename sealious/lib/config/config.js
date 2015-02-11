var fs = require("fs");
var path = require("path");

var config = JSON.parse(fs.readFileSync(path.resolve(module.filename, "../../../prometheus-config.json")));

module.exports = config;