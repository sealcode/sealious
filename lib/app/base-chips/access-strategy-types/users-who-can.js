const assert = require("assert");

const ALLOW = [{ $match: { _id: { $exists: true } } }];
const DENY = [{ $match: { _id: { $exists: false } } }];

function check_params(app, [action_name, collection]) {
	assert(["create", "delete"].includes(action_name));
	assert(
		collection instanceof app.Sealious.Collection,
		"'collection' should be an instanse of Sealious.Collection"
	);
}

module.exports = app => ({
	name: "users-who-can",
	get_pre_aggregation_stage: async function(
		context,
		[action_name, collection],
		item
	) {
		check_params(app, [action_name, collection]);
		try {
			await collection.get_access_strategy(action_name).check(context);
			return Promise.resolve(ALLOW);
		} catch (error) {
			return Promise.resolve(DENY);
		}
	},
	checker_function: async function(context, [action_name, collection]) {
		check_params(app, [action_name, collection]);
		try {
			await collection.get_access_strategy(action_name).check(context);
			return Promise.resolve();
		} catch (error) {
			return Promise.reject(
				`You can't perform this action beacuse you can't ${action_name} ${
					collection.name
				}`
			);
		}
	},
	item_sensitive: false,
});
