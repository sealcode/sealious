import { App, Context, File } from "../main";
import {
	NewSession,
	ResourceCreated,
} from "../../common_lib/response/responses";

export default function (app: App, context: Context, h: any) {
	const config = app.ConfigManager.get("www-server");
	return function (response: any) {
		let rep = null;
		if (response instanceof File) {
			if (response.id) {
				rep = h.file(response.getDataPath(), { confine: false });
			} else {
				rep = h.response(response.data);
			}
			rep.type(response.getMimeType()).header(
				"Cache-Control",
				"max-age=6000, must-revalidate"
			);
		} else if (response instanceof NewSession) {
			rep = h
				.response(response)
				.state(
					config["session-cookie-name"],
					response.metadata.session_id
				);
		} else if (response instanceof ResourceCreated) {
			rep = h.response(response).code(201);
		} else {
			rep = h.response(response);
		}
		rep.state(
			config["anonymous-cookie-name"],
			context.anonymous_session_id
		);
		return rep;
	};
}
