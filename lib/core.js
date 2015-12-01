var Sealious = require("./main.js");
var path = require("path");
var http = require("http");

var ConfigManager = require("./config/config-manager.js");

var SealiousCore = new function(){

	this.check_version = function(package_info){
		var pkg = require("../package.json")
		var pkg_split = pkg.version.split(".");
		var version = pkg_split[0] + "." + pkg_split[1];
		var url = "http://registry.npmjs.org/sealious/" + version;

		var check_request = http.get(url, function(res){
			res.setEncoding('utf8');
			var body = "";
			res.on('data', function(chunk){
				body += chunk.toString();
			});
			res.on('end', function(){
				var sealious_npm;
				try {
					sealious_npm = JSON.parse(body);
				} catch (error) {
					Sealious.Logger.error(new Sealious.Errors.Error("Could not fetch update information from NPM registry."));
				}
				if (sealious_npm.error){
					Sealious.Logger.warning("npm registry error when requesting info for version " + version + ": " + sealious_npm.error);
				} else if (!sealious_npm.version || sealious_npm === undefined){

					Sealious.Logger.warning("unknown npm registry error when requesting info for version " + version + ".");
				} else {
					var sealious_npm_array = sealious_npm.version.split(".");

					if ((sealious_npm.version !== pkg.version) && (parseInt(sealious_npm_array[2]) > parseInt(pkg_split[2]))) {
						Sealious.Logger.warning("Sealious@" + pkg.version + " - update available. Run `npm install sealious@" + sealious_npm.version + "` to update.");
					} else {
						Sealious.Logger.info("Sealious@" + pkg.version + " is up-to-date.");
					}
				}
			});
		});
		check_request.on('error', function(err){
			Sealious.Logger.warning("No network connection available! Unable to fetch information about updates to Sealious.");
		});

	}

	this.which_chip_types_to_start_for_layer = {
		db: ["datastore"],
		biz: ["field_type", "resource_type", "service"],
		web: ["field_type", "resource_type", "channel"]
	}

	this.config = function(config_object){
		ConfigManager.set_config(config_object);
	}

	this.get_dispatcher = function(mode, layer_name){
		var dispatcher_path;
		if (mode === "local") {
			dispatcher_path = "./dispatchers/local/dispatcher-local.js";
		} else {
			dispatcher_path = "./dispatchers/" + layer_name + "/dispatcher-" + layer_name + ".js";
		}
		return require(dispatcher_path);
	}

}

module.exports = SealiousCore;