var Response = require("./response.js");

var SealiousErrors = {};

SealiousErrors.Error = function(message, params, data){
	var ret = new Error(message);
	params = params || {};
	ret.is_sealious_error = true;
	ret.status_message = message;
	ret.is_error = true;
	ret.is_user_fault = params.is_user_fault===undefined? false : params.is_user_fault;
	ret.is_developer_fault = params.is_developer_fault===undefined? false : params.is_developer_fault;
	ret.type = params.type===undefined? "error" : params.type;
	ret.http_code = params.http_code===undefined? 500 : params.http_code;
	ret.data = data || params.data || {};

	return ret;
}

SealiousErrors.ValidationError = function(message, data){
	var err = new SealiousErrors.Error(message, {}, data);
	err.status_message = message;
	err.is_user_fault = true;
	err.type="validation";
	err.http_code = 403;
	return err;
}

SealiousErrors.ValueExists = function(message, data){
	var err = new SealiousErrors.Error(message, {}, data);
	err.status_message = message;
	err.is_user_fault = true;
	err.type="valueExists";
	err.http_code = 409;
	return err;	
}

SealiousErrors.InvalidCredentials = function(message, data){
	var err = new SealiousErrors.Error(message, {}, data);
	err.status_message = message;
	err.is_user_fault = true;
	err.type="authorization";
	err.http_code = 401;
	return err;	
}

SealiousErrors.NotFound = function(message, data){
	var err = new SealiousErrors.Error(message, {}, data);
	err.status_message = message;
	err.is_user_fault = true;
	err.type="not_found";
	err.http_code = 404;
	return err;	
}

SealiousErrors.InternalConnectionError = function(message, data){
	var err = new SealiousErrors.Error(message, {}, data);
	err.status_message = message;
	err.is_user_fault = false;
	err.type="internal_connection_error";
	err.http_code = 500;
	return err;
}

SealiousErrors.DependencyError = function(message, data){
	var err = new SealiousErrors.Error(message, {}, data);
	err.status_message = message;
	err.is_user_fault = false;
	err.is_developer_fault = true;
	err.type="dependency_error";
	err.http_code = 500;
	return err;
}

SealiousErrors.UnauthorizedRequest = function(message, data){
	var err = new SealiousErrors.Error(message, {}, data);
	err.status_message = message;
	err.is_user_fault = true;
	err.type="unauthorized_request";
	err.http_code = 401;
	return err;
}

SealiousErrors.DeveloperError = function(message, data){
	var err = new SealiousErrors.Error(message, {}, data);
	err.status_message = message;
	err.is_user_fault = false;
	err.is_developer_fault = true;
	err.type="dev_error";
	return err;	
}

SealiousErrors.BadContext = function(message, data){
	var err = new SealiousErrors.Error(message, {}, data);
	err.status_message = message;
	err.is_user_fault = true;
	err.type="permission";
	err.http_code = 401;
	return err;	
}

/*
process.on('uncaughtException', function (exception) {
	switch(exception.code){
		case "EACCES":
			console.log("\nNo root access - closing!\n");
			process.exit();
			break;
		case "EADDRINUSE":
			console.log("\nPort 80 is already taken - closing!\n");
			process.exit();
			break;
		default:
			console.log(exception.stack);
			throw exception;
			break;
	}
});
*/
module.exports = SealiousErrors;