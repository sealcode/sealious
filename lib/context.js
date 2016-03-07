var Sealious = require("sealious");
var promisify = require("bluebird-events");
const EventEmitter = require('events');

function Context (timestamp, ip, user_id) {
	this._cached_user_data = false
	this.loading_user_data = false;

	this.e = new EventEmitter();
	this.e.setMaxListeners(20);

	if (user_id === undefined || user_id === false) {
		user_id = null;
	}

	if (timestamp === undefined) {
		var d = new Date();
		timestamp = d.getTime();
	}


	this.timestamp = timestamp;
	this.ip = ip || null;
	this.user_id = user_id;
}

Context.prototype = new function(){

	this.get_user_data = function(){
		var self = this;

		if (this.user_id === null){
			return Promise.resolve(null);
		} else if (self.loading_user_data){
			return promisify(self.e, {
				resolve: "loaded_user_data",
				reject: "error"
			})
		} else if (self._cached_user_data === false){
			self.loading_user_data = true;

			var c = new Sealious.SuperContext(self);
			return Sealious.run_action(c, ["resources", "user", this.user_id], "show")
			.then(function(user_data){
				self._cached_user_data = user_data;
				self.loading_user_data = false;
				self.e.emit("loaded_user_data", user_data);
				return user_data;
			}).catch(function(error){
				self.e.emit("error");
				throw error;
			})
		} else {
			return Promise.resolve(self._cached_user_data);
		}
	}
}

module.exports = Context;
