function Response(data, is_error, type, status_message){
	this.status = is_error? "error" : "success";
	this.type = type || "response";
	this.status_message = status_message || ok;
	this.data = data || {};
}

module.exports = Response;