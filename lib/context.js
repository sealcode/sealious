"use strict";
const locreq = require("locreq")(__dirname);
const promisify = require("bluebird-events");
const EventEmitter = require("events");

function Context (timestamp, ip, user_id, session_id){

	Object.defineProperty(this, "_cached_user_data", {
		value: false,
		writable: true,
	});

	Object.defineProperty(this, "loading_user_data", {
		value: false,
		writable: true,
	});

	Object.defineProperty(this, "e", {
		value: new EventEmitter(),
	});
	this.e.setMaxListeners(20);

	Object.defineProperty(this, "session_id", {
		value: session_id,
	}); // to make it non-enumerable and non-writeable

	if (user_id === undefined || user_id === false){
		user_id = null;
	}

	if (timestamp === undefined){
		const d = new Date();
		timestamp = d.getTime();
	}

	this.timestamp = timestamp;
	this.ip = ip || null;
	this.user_id = user_id;
}

Context.prototype.get_user_data = function(app){
	const self = this;

	if (this.user_id === null){
		return Promise.resolve(null);
	} else if (self.loading_user_data){
		return promisify(self.e, {
			resolve: "loaded_user_data",
			reject: "error"
		});
	} else if (self._cached_user_data === false){
		const SuperContext = locreq("lib/super-context.js");
		self.loading_user_data = true;
		const c = new SuperContext(self);
		return app.run_action(c, ["collections", "users", this.user_id], "show")
		.then(function(user_data){
			self._cached_user_data = user_data;
			self.loading_user_data = false;
			self.e.emit("loaded_user_data", user_data);
			return user_data;
		}).catch(function(error){
			self.e.emit("error");
			throw error;
		});
	} else {
		return Promise.resolve(self._cached_user_data);
	}
};

module.exports = Context;
