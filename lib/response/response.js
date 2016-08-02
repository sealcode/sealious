"use strict";
"use strict";

function Response (data, is_error, type, status_message){
	this.status = is_error ? "error" : "success";
	this.type = type || "response";
	this.status_message = status_message || "ok";
	this.data = data || {};
}

Response.fromError = function(sealious_error){
	return {
		data: sealious_error.data || {},
		is_error: true,
		type: sealious_error.type,
		status_message: sealious_error.message,
		message: sealious_error.message,
	};
};

module.exports = Response;
