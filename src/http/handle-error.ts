import error_to_boom from "./error-to-boom";
import { App } from "../main";
import SealiousError from "../response/errors";

export default function (app: App) {
	return function (error: SealiousError) {
		app.Logger.error("HTTP ERR", "Responding with error", error);
		if (error instanceof SealiousError && error.is_user_fault) {
			return error_to_boom(error);
		} else {
			return error;
		}
	};
}
