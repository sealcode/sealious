import Context from "../../../context";
import Query from "../../../datastore/query";
import AccessStrategy from "../../../chip-types/access-strategy";
import App from "../../app";
import SuperContext from "../../../super-context";
import Item from "../../../../common_lib/response/item";

export default class Roles extends AccessStrategy {
	allowed_roles: string[];
	constructor(app: App, allowed_roles: string[]) {
		super(app, allowed_roles);
		this.allowed_roles = allowed_roles;
	}

	async countMatchingRoles(context: Context) {
		const user_id = context.user_id;
		const user_roles = (
			await this.app.run_action(
				new SuperContext(context),
				["collections", "user-roles"],
				"show",
				{ filter: { user: user_id } }
			)
		).items.map((role_resource: Item) => role_resource.role);

		return this.allowed_roles.filter((allowed_role) =>
			user_roles.includes(allowed_role)
		).length;
	}

	async getRestrictingQuery(context: Context) {
		if (context.is_super) {
			return new Query.AllowAll();
		}
		if (context.user_id === null) {
			return new Query.DenyAll();
		}

		const matching_roles_count = await this.countMatchingRoles(context);

		return matching_roles_count > 0
			? new Query.AllowAll()
			: new Query.DenyAll();
	}

	async checkerFunction(context: Context) {
		if (context.user_id === null) {
			return AccessStrategy.deny("you are not logged in");
		}
		const matching_roles_count = await this.countMatchingRoles(context);

		return matching_roles_count > 0
			? AccessStrategy.allow(
					`you have one of the roles: ${this.allowed_roles.join(
						", "
					)}`
			  )
			: AccessStrategy.deny(
					`you dont have any of the roles: ${this.allowed_roles.join(
						", "
					)}.`
			  );
	}
}
