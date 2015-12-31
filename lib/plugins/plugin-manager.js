var Sealious = require("../main.js");
var path = require("path");

var PluginManager = new function(){

	function load_plugins_from_dir (dir) {
		dir = dir || "";
		var root = path.resolve(dir);
		var pkgfile = path.join(root, 'package.json');
		Sealious.Logger.info("Checking " + pkgfile + " for Sealious plugins...");
		var pkg = require(pkgfile);

		var found_any_plugins = false;
		for (var dependency_name in pkg.dependencies){
			var plugin_package_info_file = path.resolve(root, "node_modules", dependency_name, "package.json");
			try {
				var plugin_package_info = require(plugin_package_info_file);				
			} catch (error){
				continue;
			}
			if (plugin_package_info.keywords && plugin_package_info.keywords.indexOf("sealious-plugin")!==-1){
				Sealious.Logger.info("	\u2713 found plugin " + plugin_package_info.name);
				found_any_plugins = true;
				var plugin_dir = path.resolve(root, "node_modules", dependency_name);
				var plugin = require(path.resolve(root, "node_modules", dependency_name));
				load_plugins_from_dir(plugin_dir);
			}
		}
		if (!found_any_plugins){
			Sealious.Logger.info("  No plugins found.")
		}
	}

	this.load_plugins = function(){
		load_plugins_from_dir("");

		var sealious_dir = path.resolve(module.filename, "../../../");
		if (sealious_dir!=path.resolve("")){
			load_plugins_from_dir(sealious_dir);			
		}

	}
}

module.exports = PluginManager;
