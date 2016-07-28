const Sealious = require("sealious");
const path = require("path");
const fs = require("fs");
const resolve = require("resolve");

function custom_resolve (plugin_name, root) {
	try {
		return resolve.sync(plugin_name, {basedir: root});
	} catch (error){
		return require.resolve(plugin_name);
	}
}

function get_package_info_path (dir, package_name) {
	var package_path = custom_resolve(package_name, dir);
	var package_info_path = null;
	while (package_info_path === null){
		var temp_path = path.resolve(package_path, "../package.json");
		try {
			fs.accessSync(temp_path, fs.F_OK);
			package_info_path = temp_path;
		} catch (e) {
			package_path = path.resolve(package_path, "../");
		}
	}
	return package_info_path;
}

function get_package_info (dir, package_name) {
	return require(get_package_info_path(dir, package_name));
}

function is_sealious_plugin (dir, module_name) {
	var plugin_package_info = get_package_info(dir, module_name);
	return plugin_package_info.keywords && plugin_package_info.keywords.indexOf("sealious-plugin") !== -1;
}

function load_plugins_from_dir (dir) {
	var root = path.resolve(dir);
	var pkgfile = path.join(root, 'package.json');
	var pkg = require(pkgfile);

	var dependencies = pkg.dependencies;
	var required_sealious_plugins = Object.keys(dependencies).filter(is_sealious_plugin.bind({}, root));


	if (required_sealious_plugins.length){
		Sealious.Logger.debug(`${pkg.name} (${pkgfile}) requires: ${required_sealious_plugins.join(", ")}`)
		for (var i in required_sealious_plugins){
			var plugin_name = required_sealious_plugins[i];
			var plugin_info_path = get_package_info_path(root, plugin_name);
			var plugin_dir = path.resolve(plugin_info_path, "../");
			load_plugins_from_dir(plugin_dir);
			require(custom_resolve(plugin_name, plugin_dir));
			Sealious.Logger.info(`\t\u2713 ${plugin_name}`)
		}
	}
}
const PluginManager = {
	load_plugins: function(){
		Sealious.Logger.info("Loading plugins...");
		const sealious_dir = path.resolve(module.filename, "../../../");
		if (sealious_dir !== path.resolve("")){
			load_plugins_from_dir(sealious_dir);
		}
		load_plugins_from_dir("");
	}
}

module.exports = PluginManager;
