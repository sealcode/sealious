"use strict";
"use strict";

const SealiousResponses = {};

SealiousResponses.NewSession = function(session_id){
	this.status = "success";
	this.message = "Logged in!";
	Object.defineProperty(this, "metadata", {value: {session_id: session_id}});
	this.data = {};
};

module.exports = SealiousResponses;
