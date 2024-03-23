import { App, Context, File } from "../main.js";
import {
	NewSession,
	ResourceCreated,
} from "../../common_lib/response/responses.js";

export default function (app: App, context: Context, h: any) {
	const config = app.ConfigManager.get("www-server");
	return function (response: any) {
		app.Logger.debug("HANDLE RESPONSE", "Handling response", response);
		let rep = null;
		if (response instanceof File) {
			app.Logger.debug3("HANDLE RESPONSE", "Response is a file");
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
			app.Logger.debug("HANDLE RESPONSE", "Response is a new session");
			rep = h
				.response(response)
				.state(
					config["session-cookie-name"],
					response.metadata.session_id
				);
		} else if (response instanceof ResourceCreated) {
			app.Logger.debug("HANDLE RESPONSE", "Response is a new resource");
			rep = h.response(response).code(201);
		} else {
			if (response?.serialize) {
				response = response.serialize();
			}
			app.Logger.debug("HANDLE RESPONSE", "Responding with", response, 4);
			rep = h.response(response);
		}
		app.Logger.debug("HANDLE RESPONSE", "returning from handle_response");
		return rep;
	};
}
