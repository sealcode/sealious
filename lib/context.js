function Context(timestamp, ip, session_id){
	this.session_id = session_id;
	this.ip = ip;
	this.timestamp = timestamp;
}


Context.prototype.get_user_id = function(){
	return Sealious.Dispatcher.users.get_user_id(this.session);
}

module.exports = Context;