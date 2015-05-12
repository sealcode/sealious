var fs = require("fs");
var path = require('path')
var Set = require('Set');
var Promise = require("bluebird");

var ConfigurationManager = require("../config/config-manager.js");

var chip_type_functions = {
	channel: 		require("./channel.js"),
	service: 		require("./service.js"),
	resource_type: 	require("./resource-type.js"),
	field_type: 	require("./field-type.js"),
	datastore: 		require("./datastore.js")
}

chips_by_module = {};

var started_chips_longids = new Set();

var chips = {};

var registred_chips_longids = new Set();

var ChipManager = new function(){

	this.add_chip = function(type, name, chip, module_path){
		if(chips[type]==undefined){
			chips[type]=[];
		}
		chips[type][name]=chip;
		if(chips_by_module[module_path]==undefined){
			chips_by_module[module_path]=[];
		}
		chips_by_module[module_path].push(chip);
	}

	this.perform_chip_action = function(module_path, action_description, dispatcher){
		var dependencies = {};
		chip_description = action_description.chip_description;
		chip_description.requires.map(function(required_chip_description){
			var longid = required_chip_description.longid;
			dependencies[longid] = ChipManager.get_chip_by_longid(longid);
		});
		switch(action_description.verb){
			case "define":
				var creator_function = chip_type_functions[chip_description.type];
				if(creator_function.is_a_constructor){
					//for field types
					var chip_instance = function(){};
					chip_instance.prototype = Object.create(creator_function.prototype);
					chip_instance.longid = chip_description.longid;
					Sealious.ChipManager.add_chip(creator_function.type_name, chip_description.longid.split(".")[1], chip_instance, module_path)
				}else{
					var chip_instance = new creator_function(module_path, chip_description.longid.split(".")[1]);
				}
				chip_instance.type = chip_description.type;
				
				var chip_config = ConfigurationManager.get_chip_config(chip_description.longid);
				chip_instance.configure && chip_instance.configure(chip_config);
				break;
			case "use":
				var chip_instance = ChipManager.get_chip_by_longid(chip_description.longid);
				break;				
		}
		var handler_function_location = module_path + "/" + action_description.verb + "/" + chip_description.longid + ".js";
		var action_handler_function = require(handler_function_location);
		action_handler_function(chip_instance, dispatcher, dependencies);
	}

	this.chip_exists = function(type, name){
		if(chips[type] && chips[type][name]){
			return true;
		}else{
			return false;
		}
	}

	this.get_chip = function(type, name){
		try{
			return chips[type][name]
		}catch(e){
			throw new Sealious.Errors.Error("ChipManager was asked to return a chip of type `" + type + "` and name `" + name + "`, but it was not found");
		}
	}

	this.get_chip_by_longid = function(longid){
		var type = longid.split(".")[0];
		var name = longid.split(".")[1];
		return this.get_chip(type, name);
	}

	this.start_chips_from_module = function(module_path, chip_types_to_start){
		var chips_to_start = chips_by_module[module_path] || [];
		var chip_types_to_start_set = new Set();
		chip_types_to_start_set.addAll(chip_types_to_start);
		chips_to_start = chips_to_start.filter(function(element){
			return chip_types_to_start_set.has(element.type);
		})
		var promises = [];
		chips_to_start.forEach(function(chip){
			if(!started_chips_longids.has(chip.longid)){
				if(chip.start){
					promises.push(chip.start());
				}
				started_chips_longids.add(chip.longid);				
			}
		})
		return Promise.all(promises);
	}

	this.chip_is_registred = function(longid){
		return this.get_chip_by_longid(longid) != undefined;
	}

	this.get_chip_amount_by_type = function(type){
		return Object.keys(chips[type]).length;
	}

	this.get_datastore_chip = function(){
		var datastore_chip_amount = this.get_chip_amount_by_type("datastore");
		if(datastore_chip_amount===0){
			throw new Sealious.Errors.Error("Chip manager was requested to return the datastore chip, but no chips of type `datastore` have been registered.")
		}
		if(datastore_chip_amount===1){
			return chips["datastore"][Object.keys(chips["datastore"])[0]]
		}
		var datastore_chip_name = ConfigurationManager.get_dispatcher_config().datastore_chip;		
		if(datastore_chip_name===undefined){
			throw new Sealious.Errors.Error("Chip manager was requested to return a datastore chip. Multiple chips of type `datastore` have been registered, and no default provided in configuration.")	
		}else{
			return this.get_chip("datastore", datastore_chip_name);
		}
	}

	this.get_chips_by_type = function(chip_type){
		return chips[chip_type];
	}
}


module.exports = ChipManager;
	
