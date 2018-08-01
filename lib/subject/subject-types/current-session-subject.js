"use strict";
const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");

const Response = locreq("lib/response/response.js");
const Errors = locreq("lib/response/error.js");
const Subject = locreq("lib/subject/subject.js");
const SuperContext = locreq("lib/super-context.js");

const CurrentSession = function(app) {
	this.app = app;
};

CurrentSession.prototype = Object.create(Subject.prototype);

CurrentSession.prototype.perform_action = async function(
	context,
	action_name,
	args
) {
	if (action_name !== "delete") {
		throw new Errors.DeveloperError(
			`Unknown action ${action_name} for CurrentSession subject.`
		);
	}
	try {
		const { items: sessions } = await this.app.run_action(
			new SuperContext(),
			["collections", "sessions"],
			"show",
			{
				filter: { "session-id": context.session_id },
			}
		);

		await Promise.map(sessions, session =>
			this.app.run_action(
				new SuperContext(),
				["collections", "sessions", session.id],
				"delete"
			)
		);

		const { items: anonymous_sessions } = await this.app.run_action(
			new SuperContext(),
			["collections", "anonymous-sessions"],
			"show",
			{
				filter: {
					"anonymous-session-id": context.anonymous_session_id,
				},
			}
		);

		await Promise.map(anonymous_sessions, session =>
			this.app.run_action(
				new SuperContext(),
				["collections", "anonymous-sessions", session.id],
				"delete"
			)
		);

		return new Response({}, false, "logged_out", "You've been logged out");
	} catch (e) {
		return Promise.reject(new Errors.BadContext("Invalid session id!"));
	}
};

module.exports = CurrentSession;
