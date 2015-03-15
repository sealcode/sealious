var fs = require("fs");
var Set = require("Set");
var Promise = require("bluebird");

var ModuleInfo 		= require("./module-info.js");
var ChipManager 	= require("../chip-types/chip-manager.js");

var DispatcherWrapper = require("../dispatchers/dispatcher-wrapper.js");

var SealiousErrors = require("../response/error.js"); //~

function ChipDescription(param){
	switch(typeof param){
		case "string":
			this.longid = param;
			this.requires = [];
			break;
		case "object":
			this.longid = param.longid;
			this.requires = param.requires.map(function(string){return new ChipDescription(string)});
			break;
	}
	this.type = this.longid.split(".")[0];
	this.name = this.longid.split(".")[1];
}

//in order for Set to properly store instances of this description
ChipDescription.prototype.toString = function(){
	return this.longid;
}

ChipActionDescription = function(verb, chip_description, module_object){
	this.verb = verb; //"define" | "use";
	this.chip_description = chip_description;
	this.module = module_object;
}

ChipActionDescription.prototype = new function(){
	this.execute = function(dispatcher){
		var type = this.chip_description.type;
		var name = this.chip_description.name;
		ChipManager.perform_chip_action(this.module.path, this, dispatcher);
	}

	this.toString = function(){
		return this.verb + ":" + this.chip_description.longid;
	}
}

var Module = function(path_to_module){
	console.log(path_to_module);
	this.path = path_to_module;
	this.info = null;
	this.load_info();
	this.initialized = false;
}

Module.prototype = new function(){
	this.load_info = function(){
		this.info = JSON.parse(fs.readFileSync(this.path + "/module.json"));
		var that = this;
		["modifies", "requires", "defines", "uses"].map(function(attribute_name){
			that.info[attribute_name] = that.info[attribute_name] || [];
			that.info[attribute_name] = that.info[attribute_name].map(function(param){
				return new ChipDescription(param);
			})
		})
	}

	this.filter_chip_descriptions = function(attribute_names){
		var ret = [];
		for(var i in attribute_names){
			var attribute_name = attribute_names[i];
			ret = ret.concat(this.info[attribute_name]);
		}
		return ret;
	}

	this.get_required_chip_ids = function(){
		return this.filter_chip_descriptions(["uses", "modifies"]).map(function(chip_description){
			return chip_description.longid;
		})
	}

	this.get_defined_chip_ids = function(){
		return this.filter_chip_descriptions(["defines"]).map(function(chip_description){
			return chip_description.longid;
		})	
	}

	this.get_initialization_instructions = function(){
		var that = this;
		var chip_initialization_instructions = [];
		var to_load = ["defines", "uses"];
		for(var i in to_load){
			var attribute_name = to_load[i];
			var to_add = this.info[attribute_name].map(function(description){
				if(attribute_name=="uses"){
					var verb = "use";
				}else{
					var verb = "define";
				}
				return new ChipActionDescription(verb, description, that);
			})
			chip_initialization_instructions = chip_initialization_instructions.concat(to_add);
		}
		return chip_initialization_instructions;
	}

	this.decide_chip_initialization_order = function(){
		var init_instructions_list = [];
		var accepted_instructions = new Set();

		var possible_init_instructions = this.get_initialization_instructions();

		var defined_so_far = new Set(this.info.requires);//we're assuming that ModuleManager took care of executing modules in such an order that all chips that are required by this module have been already initialized

		do{
			var initialized_in_this_iteration = 0;
			for(var i in possible_init_instructions){
				var current_init_instruction = possible_init_instructions[i];
				if(accepted_instructions.has(current_init_instruction)){
					//skipping any chips that have already been put on initialization list
					continue;
				}
				var chip_description = current_init_instruction.chip_description;
				var can_initialize = true;
				var required = chip_description.requires;
				for(var j in required){
					if(!defined_so_far.has(required[j])){
						can_initialize = false;
						break;
					}
				}
				if(can_initialize){
					initialized_in_this_iteration++;
					accepted_instructions.add(current_init_instruction)
					defined_so_far.add(current_init_instruction.chip_description);
					init_instructions_list.push(current_init_instruction);
				}
			}			
		}while(initialized_in_this_iteration!=0 && init_instructions_list.length!=possible_init_instructions.length);

		if(init_instructions_list.length!=possible_init_instructions.length){
			throw new SealiousError.DependencyError("cannot initialize all chips from module ", this.info.name, "because of unmet dependencies"); //~
		}

		return init_instructions_list;
	}

	this.initialize = function(dispatcher){
		var init_instructions_list = this.decide_chip_initialization_order();
		init_instructions_list.map(function(init_instruction){
			init_instruction.execute(dispatcher);
		});
		this.initialized = true;
	}

	this.start = function(chip_types_to_start){
		var promises = [];
		for(var i in chip_types_to_start){
			var chip_type = chip_types_to_start[i];
			promises.push(ChipManager.start_chips_from_module(this.path, chip_types_to_start));
		}
		return Promise.all(promises);
	}
}

module.exports = Module;