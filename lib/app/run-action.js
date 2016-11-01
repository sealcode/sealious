"use strict";
const locreq = require("locreq")(__dirname);

function run_action(RootSubject, context, subject_path, action_name, params){
	return RootSubject.get_subject(subject_path)
	.then(function(subject){
		return subject.perform_action(context, action_name, params);
	});
}

run_action.curry = function(RootSubject){
	return function(context, subject_path, action_name, params){
		return run_action(RootSubject, subject_path, action_name, params);
	};
};

module.exports = run_action;
