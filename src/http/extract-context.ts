import App from "../app/app";
import Context from "../context";

export default async function extract_context(
	app: App,
	request: {
		state: { [cookie_name: string]: string };
		info: { remoteAddress: string };
	}
): Promise<Context> {
	const config = app.ConfigManager.get("www-server");
	const cookie_name = config["session-cookie-name"];
	let session_id: string | undefined = request.state[cookie_name];
	const timestamp = Date.now();
	const ip = request.info.remoteAddress;

	if (!session_id) {
		return new Context(app, timestamp, ip, null, null);
	}

	const sessions = await app.collections.sessions
		.suList()
		.filter({ "session-id": session_id })
		.fetch();

	let user_id;
	if (sessions.empty) {
		session_id = undefined;
	} else {
		user_id = sessions.items[0].get("user") as string;
	}
	app.Logger.debug("EXTRACT CONTEXT", "User for this request is", user_id);
	return new Context(app, timestamp, ip, user_id, session_id);
}

module.exports = extract_context;
