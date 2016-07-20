var Promise = require("bluebird");
var SubjectPath = require.main.require("lib/data-structures/subject-path.js");

function Subject () {}

Subject.prototype = new function(){
	this.get_subject = function(subject_path){
		// This is a recursive function. It traverses the subject tree and returns
		// the subject referenced by  subject_path
		subject_path = new SubjectPath(subject_path);
		return Promise.resolve(this.get_child_subject(subject_path.head()))
		.then(function(child_subject){
			if (subject_path.elements.length === 1){
				return child_subject;
			} else {
				return child_subject.get_subject(subject_path.tail());
			}
		});
	};
};

module.exports = Subject;
