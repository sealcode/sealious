const Promise = require("bluebird");

const Subject = require("../subject.js");
const Errors = require("../../response/error.js");

const me_synonyms = require("../../misc/me-synonyms.json");
const MeSubject = require("./me-subject.js");
const RootSubject = require("./root-subject.js");
const SuperContext = require("../../super-context.js");

const UsersSubject = function (app) {
	this.perform_action = function (context, action_name, params) {
		params = params || {};
		switch (action_name) {
			case "create":
				return app.run_action(
					context,
					["collections", "users"],
					"create",
					params
				);
			case "show":
				return app.run_action(
					context,
					["collections", "users"],
					"show",
					params
				);
			default:
				return Promise.reject(
					new Errors.BadSubjectAction(
						`Unknown action for UsersSubject: '${action_name}'`
					)
				);
		}
	};

	this.get_child_subject = function (key) {
		if (me_synonyms.indexOf(key) !== -1) {
			return new MeSubject(app);
		}
		const username = key;
		return app
			.run_action(new SuperContext(), ["collections", "users"], "show", {
				filter: { username: username },
			})
			.then(function (sealious_response) {
				if (sealious_response.empty) {
					throw new Errors.BadSubjectPath(
						`Unknown username: '${username}'`
					);
				}
				return RootSubject.get_subject([
					"collections",
					"users",
					sealious_response.id,
				]);
			});
	};
};

UsersSubject.prototype = Object.create(Subject.prototype);

UsersSubject.subject_name = "users";

module.exports = UsersSubject;
