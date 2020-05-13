const Promise = require("bluebird");
const CurrentSessionSubject = require("../subject-types/current-session-subject.js");
const SuperContext = require("../../super-context.js");
const Errors = require("../../response/error.js");
const Subject = require("../subject.js");
const SecureHasher = require("../../utils/secure-hasher.js");

async function validate_auth_data(app, username, password) {
	const [user] = await app.Datastore.find("users", {
		"username.safe": username,
	});

	if (!user) {
		throw new Errors.InvalidCredentials("Incorrect username!");
	}

	const is_valid = await SecureHasher.matches(password, user.password);
	if (!is_valid) {
		throw new Errors.InvalidCredentials("Incorrect password!");
	}

	return user;
}

function try_to_login(app, context, { username, password }) {
	return Promise.try(async () => {
		if (!username) {
			throw new Errors.InvalidCredentials("Missing username!");
		}
		if (!password) {
			throw new Errors.InvalidCredentials("Missing password!");
		}

		const user = await validate_auth_data(app, username, password);
		const session = await app.run_action(
			new SuperContext(),
			["collections", "sessions"],
			"create",
			{ user: user.sealious_id, "session-id": null }
		);
		await app.run_action(
			new SuperContext(),
			["collections", "users", user.sealious_id],
			"edit",
			{ last_login_context: context }
		);

		return new app.Sealious.Responses.NewSession(session["session-id"]);
	});
}

const SessionsSubject = function (app) {
	this.perform_action = function (context, action_name, params) {
		params = params || {};
		switch (action_name) {
			case "create":
				return try_to_login(app, context, params);
			default:
				throw new Errors.DeveloperError(
					`Unknown/unsupported action '${action_name}' for Session Subject.`
				);
		}
	};

	this.get_child_subject = function (key) {
		switch (key) {
			case "current":
				return new CurrentSessionSubject(app);
			default:
				throw new Errors.BadSubjectPath(
					`No child subject with key '${key}' in SessionSubject`
				);
		}
	};
};

SessionsSubject.prototype = Object.create(Subject.prototype);

SessionsSubject.subject_name = "sessions";

module.exports = SessionsSubject;
