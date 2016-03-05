var Response = require("./response.js");

var SealiousErrors = {};

SealiousErrors.Error = function(message, params, data){
	params = params || {};
	this.message = message;
	this.is_user_fault = params.is_user_fault === undefined ? false : params.is_user_fault;
	this.is_developer_fault = params.is_developer_fault === undefined ? false : params.is_developer_fault;
	this.type = params.type === undefined ? "error" : params.type;
	this.data = data || params.data || {};

	Error.captureStackTrace(this, SealiousErrors.Error);
}

SealiousErrors.Error.prototype = Object.create(Error.prototype);
SealiousErrors.Error.constructor = SealiousErrors.Error;

SealiousErrors.Error.prototype.to_object = function(){
	return {
		message: this.message,
		type: this.type,
		data: this.data
	}
}

var error_types = {
	ValidationError: {
		is_user_fault: true,
		type: "validation"
	},
	ValueExists: {
		is_user_fault: true,
		type: "value_exists"
	},
	InvalidCredentials: {
		is_user_fault: true,
		type: "invalid_credentials"
	},
	NotFound: {
		is_user_fault: true,
		type: "not_found",
	},
	DeveloperError: {
		is_user_fault: false,
		is_developer_fault: true,
		type: "dev_error"
	},
	BadContext: {
		is_user_fault: true,
		type: "permission"
	},
	ServerError: {
		is_user_fault: false,
		is_developer_fault: false,
		type: "server_error"
	},
	BadSubjectPath: {
		is_user_fault: true,
		type: "bad_subject"
	},
	BadSubjectAction: {
		is_user_fault: true,
		type: "bad_subject_action"
	}
}

for (var full_name in error_types){
	var params = error_types[full_name];
	SealiousErrors[full_name] = (function(params){
		return function(message, data){
			SealiousErrors.Error.call(this, message, params, data);
		}
	})(params);
	SealiousErrors[full_name].prototype = Object.create(SealiousErrors.Error.prototype);
}

module.exports = SealiousErrors;
