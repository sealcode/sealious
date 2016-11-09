"use strict";
const locreq = require("locreq")(__dirname);


function run_action_curry(app){
	return function run_action(context, subject_path, action_name, params){
		return app.RootSubject.get_subject(subject_path)
		.then(function(subject){
			return subject.perform_action(context, action_name, params);
		});
	};
}


module.exports = run_action_curry;
