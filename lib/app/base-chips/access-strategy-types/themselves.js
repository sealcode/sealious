const Promise = require("bluebird");
const Query = require("../../../datastore/query.js");

module.exports = {
	name: "themselves",
	item_sensitive: true,
	getRestrictingQuery: async function (context, params) {
		return Query.fromSingleMatch({
			sealious_id: { $eq: context.user_id },
		});
	},
	checker_function: async function (context, params, sealious_response) {
		const user_id = sealious_response.id;
		if (context.user_id !== user_id) {
			return Promise.reject(`You are not the user of id ${user_id}.`);
		}
	},
};
