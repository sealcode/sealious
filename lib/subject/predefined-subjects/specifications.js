"use strict";
const locreq = require("locreq")(__dirname);
const Subject = locreq("lib/subject/subject.js");
const Errors = locreq("lib/response/error.js");

const SingleSpecificationSubject = locreq("lib/subject/subject-types/single-specification-subject.js");

const SpecificationsSubject = function(app){

	const actions = {
		show: function(params){
			const collections =  app.ChipManager.get_chips_by_type("collection");
			return Object.keys(collections).map((collection_name) => collections[collection_name].get_specification(false));
		},
	};

	this.get_child_subject = function(key){
		const collection_name = key;
		return new SingleSpecificationSubject(app, collection_name);
	};

	this.perform_action = function(context, action_name, params){
		return actions[action_name](params);
	};
};

SpecificationsSubject.prototype = Object.create(Subject.prototype);

SpecificationsSubject.subject_name = "specifications";

module.exports = SpecificationsSubject;
