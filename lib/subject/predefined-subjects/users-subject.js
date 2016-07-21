const Sealious = require("sealious");
const Promise = require("bluebird");

const me_synonyms = require("../../misc/me-synonyms.json");
const MeSubject = require("./me-subject.js");

const UsersSubject = function(){
	this.perform_action = function(context, action_name, params){
		params = params || {};
		switch (action_name){
		case "create":
			return Sealious.run_action(context, ["resources", "user"], "create", params);
		case "show":
			return Sealious.run_action(context, ["resources", "user"], "show", params);
		default:
			return Promise.reject(new Sealious.Errors.BadSubjectAction(`Unknown action for UsersSubject: '${action_name}'`));
		}
	};

	this.get_child_subject = function(key){
		if (me_synonyms.indexOf(key) !== -1){
			return MeSubject;
		} else {
			const username = key;
			return Sealious.run_action(new Sealious.SuperContext(), ["resources", "user"], "show", {filter:{username:username}})
			.then(function(result){
				if (result.length === 0){
					throw new Sealious.Errors.BadSubjectPath(`Unknown username: '${username}'`);
				} else {
					const user = result[0];
					return Sealious.RootSubject.get_subject(["resources", "user", user.id]);
				}
			});
		}
	};
};

UsersSubject.prototype = Object.create(Sealious.Subject.prototype);

module.exports = new UsersSubject();
