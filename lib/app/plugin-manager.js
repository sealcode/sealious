"use strict";
const uncarried_locrec = require("locreq");
const locreq = uncarried_locrec(__dirname);
const path = require("path");
const fs = require("fs");
const resolve = require("resolve");

function custom_resolve (plugin_name, root){
	try {
		return resolve.sync(plugin_name, {basedir: root});
	} catch (error){
		return require.resolve(plugin_name);
	}
}

function PluginManager(ConfigManager, Logger){
	this.ConfigManager = ConfigManager;
	this.Logger = Logger;
	this.loaded_plugins = [];
}

PluginManager.pure = {
	is_sealious_plugin: function(dir, module_name){
		const plugin_package_info = PluginManager.pure.get_package_info(dir, module_name);
		return plugin_package_info.keywords && plugin_package_info.keywords.indexOf("sealious-plugin") !== -1;
	},
	get_package_info: function(dir, package_name){
		return require(PluginManager.pure.get_package_info_path(dir, package_name));
	},
	get_package_info_path: function(dir, package_name){
		let package_path = custom_resolve(package_name, dir);
		let package_info_path = null;
		while (package_info_path === null){
			const temp_path = path.resolve(package_path, "../package.json");
			try {
				fs.accessSync(temp_path, fs.F_OK);
				package_info_path = temp_path;
			} catch (e){
				package_path = path.resolve(package_path, "../");
			}
		}
		return package_info_path;
	},
	load_plugins: function(Logger, ConfigManager, plugins, sealious_dir, app){
		Logger.info("Loading plugins...");
		if (sealious_dir !== path.resolve("")){
			PluginManager.pure.load_plugins_from_dir(Logger, ConfigManager, plugins, sealious_dir, app);
		}
		PluginManager.pure.load_plugins_from_dir(Logger, ConfigManager, plugins, "", app);
	},
	load_plugins_from_dir: function(Logger, ConfigManager, loaded_plugins, dir, app){
		const root = path.resolve(dir);
		const pkgfile = uncarried_locrec(dir).resolve("package.json");
		const pkg = require(pkgfile);

		const dependencies = pkg.dependencies || {};
		const required_sealious_plugins = Object.keys(dependencies)
		.filter(PluginManager.pure.is_sealious_plugin.bind({}, root));


		if (required_sealious_plugins.length){
			Logger.debug(`${pkg.name} (${pkgfile}) requires: ${required_sealious_plugins.join(", ")}`);
			for (const i in required_sealious_plugins){
				const plugin_name = required_sealious_plugins[i];
				const plugin_info_path = PluginManager.pure.get_package_info_path(root, plugin_name);
				const plugin_dir = path.resolve(plugin_info_path, "../");
				ConfigManager.load_default_config_for_dir(plugin_dir);
				PluginManager.pure.load_plugins_from_dir(Logger, ConfigManager, loaded_plugins, plugin_dir, app);
				if(loaded_plugins.indexOf(plugin_name) === -1){
					require(custom_resolve(plugin_name, plugin_dir))(app);
					loaded_plugins.push(plugin_name);
					Logger.info(`\t\u2713 ${plugin_name} (${plugin_dir})`);
				}else{
					Logger.info(`\	${plugin_name} (already loaded)`);
				}
			}
		}
	}
};

// not all pure methods are kept here, as they're not intended to be called from outside

PluginManager.prototype = {
	load_plugins: function(sealious_dir, app){return PluginManager.pure.load_plugins(this.Logger, this.ConfigManager, this.loaded_plugins, sealious_dir, app);},
};

module.exports = PluginManager;
