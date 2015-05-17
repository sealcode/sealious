var Immutable = require("immutable");

function Context(timestamp, ip, user_id){
	if(user_id===undefined){
		user_id=null;
	}
	var ret = Immutable.fromJS({
		timestamp: timestamp,
		ip: ip,
		user_id: user_id
	});
	return ret;
}

module.exports = Context;