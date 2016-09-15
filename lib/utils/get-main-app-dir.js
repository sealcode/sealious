"use strict";
const path = require("path");

function get_main_app_dir(){
	let topModule = module;

	while(topModule.parent){
		topModule = topModule.parent;
	}
	return path.resolve(topModule.filename, "../");
}

module.exports = get_main_app_dir;
