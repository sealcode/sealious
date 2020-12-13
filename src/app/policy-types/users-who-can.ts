import { Policy, Context, ActionName, QueryTypes, App } from "../../main";

export default class UsersWhoCan extends Policy {
	static type_name = "users-who-can";
	action_name: ActionName;
	target_collection_name: string;
	constructor([action_name, collection_name]: [ActionName, string]) {
		super([action_name, collection_name]);
		this.action_name = action_name;
		this.target_collection_name = collection_name;
	}

	getPolicy(app: App) {
		//not doing this in the constructor because the collection may not be initialized when the constructor is ran
		return app.collections[this.target_collection_name].getPolicy(
			this.action_name
		);
	}

	async _getRestrictingQuery(context: Context) {
		try {
			await this.getPolicy(context.app).check(context);
			return new QueryTypes.AllowAll();
		} catch (error) {
			return new QueryTypes.DenyAll();
		}
	}
	async checkerFunction(context: Context) {
		const policy = this.getPolicy(context.app);
		const result = await policy.check(context);
		if (result === null) {
			return null;
		}
		if (result.allowed) {
			context.app.Logger.debug3("UsersWhoCan", "allowed", { policy });
			return Policy.allow(
				`you can run action '${this.action_name}' on collection '${this.target_collection_name}'`
			);
		} else {
			context.app.Logger.debug3("UsersWhoCan", "denied");
			return Policy.deny(
				`you can't ${this.action_name} ${this.target_collection_name} - because  ${result?.reason}`
			);
		}
	}
	isItemSensitive = async () => false;
}
