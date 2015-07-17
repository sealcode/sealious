var Sealious = require("../main.js");
var path = require("path");

var PluginManager = new function(){

	this.load_plugins = function(package_dir){
		package_dir = package_dir || "";
		var root = path.resolve(package_dir);
		var pkgfile = path.join(root, 'package.json');
		var pkg = require(pkgfile);

		for(var dependency_name in pkg.dependencies){
			var plugin_package_info_file = path.resolve(root, "node_modules", dependency_name, "package.json");
			var plugin_package_info = require(plugin_package_info_file);
			if(plugin_package_info.keywords && plugin_package_info.keywords.indexOf("sealious-plugin")!==-1){
				Sealious.Logger.info("Detected plugin " + plugin_package_info.name);
				var plugin = require(path.resolve(root, "node_modules", dependency_name));
			}
		}	
	}
}

module.exports = PluginManager;
