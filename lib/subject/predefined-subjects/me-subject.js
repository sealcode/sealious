var Sealious = require("sealious");

var MeSubject = function(){
	this.perform_action = function(context, action_name, params){
		return Sealious.run_action(context, ["resources", "user", context.user_id], action_name, params)
		.catch(function(error){
			if (error.type === "not_found"){
				throw new Sealious.Errors.InvalidCredentials("You're not logged in!");
			}
		})
	}
}

MeSubject.prototype = Object.create(Sealious.Subject.prototype);

module.exports = new MeSubject();
