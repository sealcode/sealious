"use strict";
const locreq = require("locreq")(__dirname);
const Subject = locreq("lib/subject/subject.js");
const Errors = locreq("lib/response/error.js");

const SingleSpecificationsSubject = function(app, collection_name){

	const actions = {
		show: function(params){
			const collection = app.ChipManager.get_chip("collection", collection_name);
			return collection.get_specification(false);
		},
	};

	this.perform_action = function(context, action_name, params){
		try {
			return actions[action_name](params);
		}catch(e){
			return Promise.reject(new Errors.BadSubjectAction(`Unknown action for SingleSpecificationsSubject: '${action_name}'`));
		}
	};
};

SingleSpecificationsSubject.prototype = Object.create(Subject.prototype);

SingleSpecificationsSubject.subject_name = "specifications";

module.exports = SingleSpecificationsSubject;
