var Sealious = require("sealious");
var Promise = require("bluebird");

function Action (subject_path, action_name) {
	this.subject_path = new Sealious.SubjectPath(subject_path);
	this.action_name = action_name
}

Action.prototype = new function(){

	this.perform = this.run = function(context){
		var self = this;

		var args = Array.prototype.slice.call(arguments, 1);

		return Promise.try(function(){
			return Sealious.RootSubject.get_subject(self.subject_path)
			.then(function(subject){
				return subject.perform_action.apply(subject, [context, self.action_name].concat(args))
			})
		})
	}
}

module.exports = Action;
