var Sealious = require("sealious");

module.exports = function(context, subject_path, action_name, params){
	var action = new Sealious.Action(subject_path, action_name);
	return action.run(context, params);
}
