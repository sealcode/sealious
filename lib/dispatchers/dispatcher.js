var Sealious = require("sealious");
var fs = require("fs");
var path = require("path");

function Dispatcher () {
	this.datastore_chip = null;
}

Dispatcher.prototype.init = function(){
	this.datastore_chip = Sealious.ChipManager.get_datastore_chip();
	process_all_core_service_methods();
	process_all_datastore_methods();
}

var dispatcher = new Dispatcher();

var process_all_core_service_methods = function(){
	var core_services_path = path.resolve(module.filename, "../../core-services/");
	var services_filenames = fs.readdirSync(core_services_path);

	for (var i in services_filenames) {
		var filename = services_filenames[i];
		var service = require("../core-services/" + filename);

		this[service.name] = Object.create(service);
		for (var method_name in service) {
			if (service[method_name] instanceof Function) {
				this[service.name][method_name] = service[method_name];
			}
		}
	}
}.bind(dispatcher)

var process_all_datastore_methods = function(){
	this.datastore = {};
	for (var method_name in this.datastore_chip) {
		if (this.datastore_chip[method_name] instanceof Function) {
			this.datastore[method_name] = this.datastore_chip[method_name];
		}
	}
}.bind(dispatcher)


module.exports = dispatcher;