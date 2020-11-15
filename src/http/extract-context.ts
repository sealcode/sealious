import App from "../app/app";
import Context from "../context";

export default async function extract_context(app: App, request: any) {
	const config = app.ConfigManager.get("www-server");
	const cookie_name = config["session-cookie-name"];
	let session_id = request.state[cookie_name];

	const sessions = await app.collections.sessions
		.suList()
		.filter({ "session-id": session_id })
		.fetch();

	const timestamp = Date.now();
	const ip = request.info.remoteAddress;
	let user;
	if (sessions.empty) {
		session_id = undefined;
	} else {
		user = sessions.items[0].get("user");
	}
	app.Logger.debug("EXTRACT CONTEXT", "User for this request is", user);
	return new Context(app, timestamp, ip, user, session_id);
}

module.exports = extract_context;
