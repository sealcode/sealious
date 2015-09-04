var Sealious = require("../main.js");

var fs = require("fs");
var path = require('path')
var Set = require('Set');
var Promise = require("bluebird");

var ConfigurationManager = require("../config/config-manager.js");

var chip_type_functions = {
	channel: 		require("./channel.js"),
	resource_type: 	require("./resource-type.js"),
	field_type: 	require("./field-type.js"),
	datastore: 		require("./datastore.js")
}

chips_by_module = {};

var started_chips_longids = new Set();

var chips = {};

var chip_type_start_order = ["datastore", "field_type", "resource_type", "access_strategy", "channel"];

var registred_chips_longids = new Set();

var ChipManager = new function(){

	this.start_chips = function(chip_types_to_start){
		Sealious.Logger.info("Starting all chips:");
		var promises = [];
		for(var i in chip_type_start_order){
			var type = chip_type_start_order[i];
			if(chips[type] && chip_types_to_start.indexOf(type)!==-1){
				Sealious.Logger.info("   " + type + ":");
				for(var name in chips[type]){
					var chip = chips[type][name];
					Sealious.Logger.info("\t  \u2713 " + name);
					try{
						if(chip.start){
							var promise = chip.start();
							promises.push(promise);
						}
					}catch(error){
						Sealious.Logger.error("\t  " + "couldn't start `" + name + "`");
						return Promise.reject(error);
					}
				}
			}
		}
		return Promise.all(promises);
	}

	this.add_chip = function(type, name, chip){
		if(chips[type]==undefined){
			chips[type]=[];
		}
		chips[type][name]=chip;
		// if(chips_by_module[module_path]==undefined){
		// 	chips_by_module[module_path]=[];
		// }
		// chips_by_module[module_path].push(chip);
	}

	this.get_all_resource_types = function(){
		var names = [];
		for (resource_type in chips.resource_type) {
		  names.push(resource_type);
		}

		return names;
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

	this.chip_is_registred = function(longid){
		return this.get_chip_by_longid(longid) != undefined;
	}

	this.get_chip_amount_by_type = function(type){
		if(chips[type]){
			return Object.keys(chips[type]).length;
		}else{
			return 0;
		}
	}

	this.get_datastore_chip = function(){
		var datastore_chip_amount = this.get_chip_amount_by_type("datastore");
		if(datastore_chip_amount===0){
			throw new Sealious.Errors.Error("Chip manager was requested to return the datastore chip, but no chips of type `datastore` have been registered.")
		}else if(datastore_chip_amount===1){
			return chips["datastore"][Object.keys(chips["datastore"])[0]]
		}else{
			var datastore_chip_name = ConfigurationManager.get_config().datastore_chip_name;		
			if(datastore_chip_name===undefined){
				throw new Sealious.Errors.Error("Chip manager was requested to return a datastore chip. Multiple chips of type `datastore` have been registered, and no default provided in configuration.")	
			}else{
				return this.get_chip("datastore", datastore_chip_name);
			}			
		}
	}

	this.get_chips_by_type = function(chip_type){
		return chips[chip_type];
	}
}


module.exports = ChipManager;
	
