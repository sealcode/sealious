import Subject from "../subject.js";
import * as Errors from "../../response/errors";

import me_synonyms from "../../misc/me-synonyms";
import MeSubject from "./me-subject";
import SuperContext from "../../super-context.js";
import App from "../../app/app.js";
import Context from "../../context.js";
import { ActionName } from "../../action.js";

export default class UsersSubject extends Subject {
	getName = () => "users";

	performAction(context: Context, action_name: ActionName, params: any) {
		params = params || {};
		switch (action_name) {
			case "create":
				return this.app.run_action(
					context,
					["collections", "users"],
					"create",
					params
				);
			case "show":
				return this.app.run_action(
					context,
					["collections", "users"],
					"show",
					params
				);
			default:
				return Promise.reject(
					new Errors.BadSubjectAction(
						`Unknown action for UsersSubject: '${action_name}'`
					)
				);
		}
	}

	async getChildSubject(key: string) {
		if (me_synonyms.indexOf(key) !== -1) {
			return new MeSubject(this.app);
		}
		const username = key;
		const response = await this.app.run_action(
			new SuperContext(),
			["collections", "users"],
			"show",
			{
				filter: { username: username },
			}
		);

		if (response.empty) {
			throw new Errors.BadSubjectPath(`Unknown username: '${username}'`);
		}
		return this.app.RootSubject.getSubject([
			"collections",
			"users",
			response.id,
		]);
	}
}
