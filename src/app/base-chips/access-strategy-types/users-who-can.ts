import {
	AccessStrategy,
	Context,
	CollectionDefinition,
	ActionName,
	App,
	Collection,
	Query,
} from "../../../main";

export default class UsersWhoCan extends AccessStrategy {
	action_name: ActionName;
	target_collection: Collection;
	target_access_strategy: AccessStrategy;
	constructor(
		app: App,
		[action_name, collection_def]: [ActionName, CollectionDefinition]
	) {
		super(app, [action_name, collection_def]);
		this.action_name = action_name;
		this.target_collection = Collection.fromDefinition(app, collection_def);
		this.target_access_strategy = this.target_collection.getAccessStrategy(
			this.action_name
		);
	}
	async getRestrictingQuery(context: Context) {
		try {
			await this.target_access_strategy.check(context);
			return new Query.AllowAll();
		} catch (error) {
			return new Query.DenyAll();
		}
	}
	async checkerFunction(context: Context) {
		const result = await this.target_access_strategy.check(context);
		if (result === null) {
			return null;
		}
		if (result.allowed) {
			return AccessStrategy.allow(
				`you can run action '${this.action_name}' on collection '${this.target_collection.name}'`
			);
		} else {
			return AccessStrategy.deny(
				`you can't run action '${this.action_name}' on collection '${this.target_collection.name}' - becasue ${result?.reason}`
			);
		}
	}
	isItemSensitive = async () => false;
}
