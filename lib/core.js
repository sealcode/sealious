"use strict";
const Sealious = require("./main.js");
const http = require("http");
const path = require("path");
const fs = require("fs");
const yaml = require("js-yaml");

const ConfigManager = require("./config/config-manager.js");

const SealiousCore = {
	get_default_config: function(dir){
		const default_config_file = path.join(dir, "default_config.yml");
		try {
			const default_config = yaml.safeLoad(fs.readFileSync(default_config_file, "utf8"));
			for (const i in default_config){
				ConfigManager.set_default_config(i, default_config[i]);
			}
		}
		catch(e){
			// error
		}
	},
	check_version: function(package_info){
		const pkg = require("../package.json");
		const pkg_split = pkg.version.split(".");
		const version = pkg_split[0] + "." + pkg_split[1];
		const url = "http://registry.npmjs.org/sealious/" + version;

		const check_request = http.get(url, function(res){
			res.setEncoding("utf8");
			let body = "";
			res.on("data", function(chunk){
				body += chunk.toString();
			});
			let sealious_npm;
			res.on("end", function(){
				try {
					sealious_npm = JSON.parse(body);
				} catch (error){
					Sealious.Logger.error(new Sealious.Errors.Error("Could not fetch update information from NPM registry."));
				}
				if (sealious_npm.error){
					Sealious.Logger.warning("npm registry error when requesting info for version " + version + ": " + sealious_npm.error);
				} else if (!sealious_npm.version || sealious_npm === undefined){
					Sealious.Logger.warning("unknown npm registry error when requesting info for version " + version + ".");
				} else {
					const sealious_npm_array = sealious_npm.version.split(".");

					if ((sealious_npm.version !== pkg.version) && (parseInt(sealious_npm_array[2]) > parseInt(pkg_split[2]))){
						Sealious.Logger.warning("Sealious@" + pkg.version + " - update available. Run `npm install sealious@" + sealious_npm.version + "` to update.");
					} else {
						Sealious.Logger.info("Sealious@" + pkg.version + " is up-to-date.");
					}
				}
			});
		});
		check_request.on("error", function(err){
			Sealious.Logger.warning("No network connection available! Unable to fetch information about updates to Sealious.");
		});

	},
	config: function(config_object){
		ConfigManager.set_config(config_object);
	}

};

module.exports = SealiousCore;
