var Sealious = require("sealious");

var ResourcesSubject = require("./resources-subject.js");

var RootSubject = function(){

	this.get_child_subject = function(key){
		switch (key){
			case "resources":
				return ResourcesSubject;
			default:
				throw new Sealious.Errors.BadSubjectPath(`No child subject with key '${key}' in RootSubject.`)
		}
	}
}

RootSubject.prototype = Object.create(Sealious.Subject.prototype)

module.exports = new RootSubject();