"use strict";

const SealiousResponses = {};

SealiousResponses.NewSession = function(session_id){
	this.status = "success";
	this.message = "Logged in!";
	Object.defineProperty(this, "metadata", {value: {session_id: session_id}});
	this.data = {};
};

SealiousResponses.ResourceCreated = function(resource_representation){
	for(const i in resource_representation){
		this[i] = resource_representation[i];
	}
};

module.exports = SealiousResponses;
