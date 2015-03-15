var fs = require("fs");
var path = require("path");
var Set = require("Set");
var Promise = require("bluebird");

var Module = require("./module.js");

var SealiousErrors = require("../response/error.js"); //~

function intersection_of_arrays(array1, array2){
	//console.log("comparing arrays, ", array1, array2)
	array3 = array1.filter(function(n) {
		return array2.indexOf(n) != -1;
	});
	return array3;
}

var ModuleManager = new function(){

	var modules_by_id = {};

	function get_module_count(){
		var c = 0;
		for(var i in modules_by_id){
			c++;
		}
		return c;
	}

	this.add_module = function(module_dir){
		var current_module = new Module(module_dir);
		modules_by_id[current_module.info.name] = current_module;
		current_module.registered = true;
	}

	this.add_modules = function(modules_dir){
		var modules_dir_contents = fs.readdirSync(modules_dir);
		for(var i in modules_dir_contents){
			var current_module_path = path.resolve(modules_dir, modules_dir_contents[i]);
			this.add_module(current_module_path);
		}
	}

	function count_registred_modules(){
		var c = 0;
		for(var i in modules_by_id){
			c++;
		}
		return c;
	}

	function decide_module_execution_order(){
		var initialization_list = [];
		var accepted_ids = new Set();

		var defined_so_far_chip_ids = new Set();

		var total_module_count = count_registred_modules();

		do{
			var initialized_in_this_iteration = 0;
			for(var module_id in modules_by_id){
				if(accepted_ids.has(module_id)){
					continue;
				}
				var initialize_module = true;
				var current_module = modules_by_id[module_id];
				var required_chips = [];
				required_chips = current_module.get_required_chip_ids();
				var chips_defined_by_current_module = current_module.get_defined_chip_ids();
				var chips_defined_by_current_module_set = new Set();
				chips_defined_by_current_module_set.addAll(chips_defined_by_current_module);
				required_chips.forEach(function(chip_id){
					if(!defined_so_far_chip_ids.has(chip_id) && !chips_defined_by_current_module_set.has(chip_id)){
						initialize_module = false;
						console.log("cannot initialize ", module_id, "because of ", chip_id);
					}
				})
				if(initialize_module){
					console.log("initializing module", module_id);
					initialization_list.push(module_id);
					accepted_ids.add(module_id);
					initialized_in_this_iteration++;
					defined_so_far_chip_ids.addAll(chips_defined_by_current_module);
				}
			}			
		}while(initialized_in_this_iteration!=0 && total_module_count!=initialization_list.length);
		if(total_module_count!=initialization_list.length){
			throw new SealiousErrors.DependencyError("Cannot initialize some modules because of circular dependency"); //~
		}
		return initialization_list;
	}

	this.initialize_all = function(dispatcher){
		var module_ids = decide_module_execution_order();
		for(var i in module_ids){
			var module_id = module_ids[i];
			modules_by_id[module_id].initialize(dispatcher);
		}
	}

	this.start = function(chip_types_to_start){
		var promises = [];
		for(var module_id in modules_by_id){
			var module = modules_by_id[module_id];
			promises.push(module.start(chip_types_to_start));
		}
		return Promise.all(promises);
	}

}

module.exports = ModuleManager;