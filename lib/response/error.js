var Response = require("./response.js");

var SealiousErrors = {};

SealiousErrors.Error = function(message){
	this.message = message;
	this.is_user_fault = false;
	this.type = "error";
	this.http_code = 500;
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
	err.type="invalidCredentials";
	err.http_code = 401;
	return err;	
}

module.exports = SealiousErrors;