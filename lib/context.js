var Immutable = require("immutable");

function Context (timestamp, ip, user_id) {
	if (user_id === undefined) {
		user_id = null;
	}
	if (timestamp == undefined) {
		var d = new Date();
		timestamp = d.getTime();
	}
	var ret = Immutable.fromJS({
		timestamp: timestamp,
		ip: ip || null,
		user_id: user_id
	});
	return ret;
}

module.exports = Context;