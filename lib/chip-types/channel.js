function channel(id, mode){
	this.id = id;
}

channel.prototype  = new function(){
	this.start = function(){
		return true;	
	}
}

module.exports = channel;