function channel(longid){
	this.longid = longid;
}

channel.prototype  = new function(){
	this.start = function(){
		//to be overwritten
		return true;	
	}
}

channel.is_a_constructor = false;

module.exports = channel;