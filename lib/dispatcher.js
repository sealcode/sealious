var Promise = require("bluebird");

var Dispatcher = function(){
	this.dispatch = function(method_name, subject_path, params){
		var subject = new Sealious.Subject(subject_path);
		subject.perform_method(method_name, params);
	}
}

module.exports = new Dispatcher();