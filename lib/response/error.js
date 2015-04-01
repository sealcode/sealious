var Response = require("./response.js");

var SealiousErrors = {};

SealiousErrors.Error = function(message, params){
	//var ret = new Error(message);
	params = params || {};
	this.message = message;
	this.is_error = true;
	this.is_user_fault = params.is_user_fault===undefined? false : params.is_user_fault;
	this.is_developer_fault = params.is_developer_fault===undefined? false : params.is_developer_fault;
	this.type = params.type===undefined? "error" : params.type;
	this.http_code = params.http_code===undefined? 500 : params.http_code;
}

SealiousErrors.Error.prototype = new function(){


	this.is_error = true;

	this.toResponse = function(){
		return new Response({}, true, this.type, this.message);
	}

	this.toString = function(){

	}
}

SealiousErrors.ValidationError = function(message){
	var err = new SealiousErrors.Error(message);
	err.is_user_fault = true;
	err.type="validation";
	return err;
}

SealiousErrors.ValueExists = function(message){
	var err = new SealiousErrors.Error(message);
	err.is_user_fault = true;
	err.type="valueExists";
	this.http_code = 409;
	return err;	
}

SealiousErrors.InvalidCredentials = function(message){
	var err = new SealiousErrors.Error(message);
	err.is_user_fault = true;
	err.type="validation";
	err.http_code = 401;
	return err;	
}

SealiousErrors.NotFound = function(message){
	var err = new SealiousErrors.Error(message);
	err.is_user_fault = true;
	err.type="not_found";
	err.http_code = 404;
	return err;	
}

SealiousErrors.InternalConnectionError = function(message){
	var err = new SealiousErrors.Error(message);
	err.is_user_fault = false;
	err.type="internal_connection_error";
	err.http_code = 500;
	return err;
}

SealiousErrors.DependencyError = function(message){
	var err = new SealiousErrors.Error(message);
	err.is_user_fault = false;
	err.is_developer_fault = true;
	err.type="dependency_error";
	err.http_code = 500;
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