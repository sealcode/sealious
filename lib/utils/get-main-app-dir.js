"use strict";

function get_main_app_dir(){
	let topModule = module;

	while(topModule.parent){
		topModule = topModule.parent;
	}
	return topModule.id;
}

module.exports = get_main_app_dir;
