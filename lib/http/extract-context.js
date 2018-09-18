"use strict";
const Sealious = require("../../lib/main");

function create_anonymous_session(app) {
	return app.run_action(
		new Sealious.SuperContext(),
		["collections", "anonymous-sessions"],
		"create",
		{ "anonymous-session-id": null, "anonymous-user-id": null } //need to provide null here so the ids are genreated. Skipping the field would leave them "undefined"
	);
}

function get_anonymous_session(app, anon_session_id) {
	return app
		.run_action(
			new Sealious.SuperContext(),
			["collections", "anonymous-sessions"],
			"show",
			{
				filter: { "anonymous-session-id": anon_session_id },
			}
		)
		.then(function({ items: anon_sessions }) {
			if (anon_sessions.length === 0) {
				return create_anonymous_session(app);
			} else {
				return anon_sessions[0];
			}
		});
}

async function extract_context(app, request) {
	const config = app.ConfigManager.get("www-server");
	const cookie_name = config["session-cookie-name"];
	const anon_cookie_name = config["anonymous-cookie-name"];
	let session_id = request.state[cookie_name];
	let anon_session_is_new = request.state[anon_cookie_name] === undefined;

	let anonymous_session_id = null;

	let get_anonymous_data = null;

	if (anon_session_is_new) {
		get_anonymous_data = create_anonymous_session(app);
	} else {
		anonymous_session_id = request.state[anon_cookie_name];
		get_anonymous_data = get_anonymous_session(app, anonymous_session_id);
	}

	let anonymous_user_id = null;

	await get_anonymous_data.then(function(anon_session) {
		anonymous_session_id = anon_session["anonymous-session-id"];
		anonymous_user_id = anon_session["anonymous-user-id"];
	});

	const { items: results } = await app.run_action(
		new Sealious.SuperContext(),
		["collections", "sessions"],
		"show",
		{ filter: { "session-id": session_id } }
	);

	const timestamp = Date.now();
	const ip = request.info.remoteAddress;
	let user;
	if (results.length === 0) {
		session_id = undefined;
	} else {
		user = results[0].user;
	}
	return new Sealious.Context(
		timestamp,
		ip,
		user,
		session_id,
		anonymous_session_id,
		anon_session_is_new,
		anonymous_user_id
	);
}

module.exports = extract_context;
