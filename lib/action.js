var Sealious = require("sealious");
var Promise = require("bluebird");

function Action (subject_path, action_name) {
	this.subject_path = new Sealious.SubjectPath(subject_path);
	this.action_name = action_name
}

Action.prototype = new function(){
	
	this.perform = function(context, args){
		var self = this;
		return Promise.try(function(){
			var subject = Sealious.RootSubject.get_subject(self.subject_path);
			console.log(context, self.action_name, args);
			return Promise.resolve(subject.perform_action(context, self.action_name, args));
		})
	}

	this.run = this.perform;
}

module.exports = Action;