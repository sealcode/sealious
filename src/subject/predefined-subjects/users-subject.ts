import Subject from "../subject";
import * as Errors from "../../response/errors";

import me_synonyms from "../../misc/me-synonyms";
import MeSubject from "./me-subject";
import Context from "../../context";
import { CreateActionName, ShowActionName } from "../../action";

export default class UsersSubject extends Subject {
	getName = () => "users";

	async performAction(
		context: Context,
		action_name: CreateActionName | ShowActionName,
		params: any
	) {
		params = params || {};
		switch (action_name) {
			case "create":
				return this.app.runAction(
					context,
					["collections", "users"],
					"create",
					params
				);
			case "show":
				return this.app.runAction(
					context,
					["collections", "users"],
					"show",
					params
				);
			default:
				throw new Errors.BadSubjectAction(
					`Unknown/unsupported action for UsersSubject: '${action_name}'`
				);
		}
	}

	async getChildSubject(path_element: string) {
		if (me_synonyms.indexOf(path_element) !== -1) {
			return new MeSubject(this.app);
		}
		const username = path_element;
		const response = await this.app.runAction(
			new this.app.SuperContext(),
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
