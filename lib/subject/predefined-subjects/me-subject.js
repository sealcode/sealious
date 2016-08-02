const locreq = require("locreq")(__dirname);
const Subject = locreq("lib/subject/subject.js");
const Errors = locreq("lib/response/error.js");

const MeSubject = function(){
	this.perform_action = function(context, action_name, params){
		return context.run_action(["resources", "user", context.user_id], action_name, params)
		.catch({type: "not_found"}, function(error){
			throw new Errors.InvalidCredentials("You're not logged in!");
		});
	};
};

MeSubject.prototype = Object.create(Subject.prototype);

module.exports = new MeSubject();
