var Sealious = require("sealious");

module.exports = function(context, subject_path, action_name, params){
	return Sealious.RootSubject.get_subject(subject_path)
	.then(function(subject){
		return subject.perform_action(context, action_name, params);
	});
};
