function Context(timestamp, ip, session_id){
	this.session_id = session_id;
	this.ip = ip;
	this.timestamp = timestamp;
}


module.exports = Context;