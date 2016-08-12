"use strict";
const locreq = require("locreq")(__dirname);

const RootSubject = locreq("lib/subject/predefined-subjects/root-subject.js");

module.exports = function(context, subject_path, action_name, params){
	return RootSubject.get_subject(subject_path)
	.then(function(subject){
		return subject.perform_action(context, action_name, params);
	});
};
