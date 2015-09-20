var Sealious = require("../main.js");
var ResourceManager = Sealious.ResourceManager;
var ChipManager = require("../chip-types/chip-manager.js");
var FileManager = require("../core-services/file-manager.js");

var fs = require("fs");
var path = require("path");

Dispatcher = function() {
	this.datastore_chip = null;
}

Dispatcher.prototype = new function() {

	this.set_datastore = function(datastore_chip) {
		this.datastore_chip = datastore_chip;
	}

	this.init = function() {
		this.set_datastore(ChipManager.get_datastore_chip());
		this.process_all_core_service_methods();
		this.process_all_datastore_methods();
	}

	this.start = function() {};

	this.process_all_core_service_methods = function() {
		var core_services_path = path.resolve(module.filename, "../../core-services/");
		var services_filenames = fs.readdirSync(core_services_path);

		for (var i in services_filenames) {
			var filename = services_filenames[i];
			var service = require("../core-services/" + filename);

			if (this.process_core_service_method) {
				this[service.name] = Object.create(service);
				for (var method_name in service) {
					if (service[method_name] instanceof Function) {
						this[service.name][method_name] = this.process_core_service_method(service, service.name, method_name);
					}
				}
			} else {
				throw new Sealious.Errors.Error("Dispatcher should implement `process_core_service_method`");
			}

		}
	}

	this.process_all_datastore_methods = function() {
		if (this.process_datastore_method) {
			this.datastore = {};
			for (var method_name in this.datastore_chip) {
				if (this.datastore_chip[method_name] instanceof Function) {
					this.datastore[method_name] = this.process_datastore_method(this.datastore_chip, method_name);
				}
			}
		} else {
			throw new Sealious.Errors.Error("Dispatcher should implement `process_datastore_method`");
		}
	}

}

module.exports = Dispatcher;