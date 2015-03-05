var ChipManager = require("../chip-types/chip-manager.js");
var ResourceManager = require("../chip-types/resource-manager.js");
var Errors = require("../response/error.js");

Dispatcher = function(){
	this.datastore_chip = null;
}

Dispatcher.prototype = new function(){

	this.set_datastore = function(datastore_chip){
		this.datastore = datastore_chip;
	}

	this.init = function(){
		this.set_datastore(ChipManager.get_datastore_chip());
		this.process_all_resource_manager_methods();
		this.process_all_service_methods();			
		this.start();
	}

	this.start = function(){
	};

	this.process_all_resource_manager_methods = function(){
		this.resources = {};
		if(this.process_resource_manager_method){
			for(var method_name in ResourceManager){
				if(ResourceManager[method_name] instanceof Function){
					this.resources[method_name] = this.process_resource_manager_method(ResourceManager, method_name);
				}
			}
		}else{
			throw new Errors.Error("Dispatcher should implement `process_resource_manager_method`");
		}
	}

	this.process_all_service_methods = function(){
		if(this.process_service_method){
			var services = ChipManager.get_chips_by_type("service");
			this.services = {};
			for(var service_name in services){
				console.log("service_name:", service_name);
				var service = services[service_name];
				this.services[service_name] = {};
				for(var method_name in service){
					if(service[method_name] instanceof Function){
						this.services[service_name][method_name] = this.process_service_method(service, service_name, method_name);
					}
				}
			}
		}else{
			throw new Errors.Error("Dispatcher should implement `process_service_method`");
		}
	}

}

module.exports = Dispatcher;