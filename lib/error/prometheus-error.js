var PrometheusError = function(message, code, module) {
	this.message = message;
	this.code = code;
	this.module = module;

	this.console_message = "\n*****ERROR*****\n";
	this.console_message+= message;
	this.console_message+= "Module: "+module+"\n";
	this.console_message+= "***************\n";
}

PrometheusError.prototype = Object.create(Error.prototype);


module.exports = PrometheusError;