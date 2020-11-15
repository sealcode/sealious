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

async function tryToLogin(app: App, { username, password }: TryToLoginParams) {
	if (!username) {
		throw new Errors.InvalidCredentials("Missing username!");
	}
	if (!password) {
		throw new Errors.InvalidCredentials("Missing password!");
	}

	const user = await validateAuthData(app, username, password);
	const session = app.collections.sessions.make({
		user: user.id,
		"session-id": null,
	});
	await session.save(new app.SuperContext());
	return new NewSession(session.get("session-id") as string);
}

export default class SessionsSubject extends Subject {
	async performAction(
		_: Context,
		action_name: CreateActionName,
		params: any
	) {
		if (action_name === "create") {
			return tryToLogin(this.app, params || {});
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
