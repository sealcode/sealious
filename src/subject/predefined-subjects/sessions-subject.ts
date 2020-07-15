import Subject from "../subject";
import App from "../../app/app";
import Context from "../../context";
import { NewSession } from "../../../common_lib/response/responses";
import { CreateActionName } from "../../action";

import CurrentSessionSubject from "../subject-types/current-session-subject";
import * as Errors from "../../response/errors";
import SecureHasher from "../../utils/secure-hasher";

async function validateAuthData(app: App, username: string, password: string) {
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

type TryToLoginParams = {
	username: string;
	password: string;
};

async function tryToLogin(
	app: App,
	context: Context,
	{ username, password }: TryToLoginParams
) {
	if (!username) {
		throw new Errors.InvalidCredentials("Missing username!");
	}
	if (!password) {
		throw new Errors.InvalidCredentials("Missing password!");
	}

	const user = await validateAuthData(app, username, password);
	const session = await app.runAction(
		new app.SuperContext(),
		["collections", "sessions"],
		"create",
		{ user: user.sealious_id, "session-id": null }
	);
	await app.runAction(
		new app.SuperContext(),
		["collections", "users", user.sealious_id],
		"edit",
		{ last_login_context: context }
	);
	return new NewSession(session["session-id"]);
}

export default class SessionsSubject extends Subject {
	async performAction(
		context: Context,
		action_name: CreateActionName,
		params: any
	) {
		if (action_name === "create") {
			return tryToLogin(this.app, context, params || {});
		}
		throw new Errors.BadSubjectAction(
			`Unknown/unsupported action '${action_name}' for SessionsSubject`
		);
	}

	async getChildSubject(path_element: string) {
		if (path_element === "current") {
			return new CurrentSessionSubject(this.app);
		}
		throw new Errors.BadSubjectPath(
			`No child subject with key '${path_element}' in SessionSubject`
		);
	}

	getName() {
		return "sessions";
	}
}
