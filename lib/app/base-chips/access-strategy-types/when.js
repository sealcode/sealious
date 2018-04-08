"use strict";
const Promise = require("bluebird");
const Query = require("../../../datastore/query.js");

async function construct_query(
	app,
	context,
	collection_name,
	special_filter_name,
	when_true_name,
	when_false_name = "noone"
) {
	const collection = app.ChipManager.get_chip("collection", collection_name);
	const special_filter = collection.get_named_filter(special_filter_name);
	const when_true = new app.Sealious.AccessStrategy(app, when_true_name);
	const when_false = new app.Sealious.AccessStrategy(app, when_false_name);
	return new Query.Or(
		new Query.And(
			await special_filter.getFilteringQuery(collection),
			await when_true.getRestrictingQuery(context)
		),
		new Query.And(
			new Query.Not(await special_filter.getFilteringQuery(collection)),
			await when_false.getRestrictingQuery(context)
		)
	);
}

module.exports = app => ({
	name: "when",
	getRestrictingQuery: async function(
		context,
		[
			collection_name,
			special_filter_name,
			when_true_name,
			when_false_name = "noone",
		]
	) {
		return construct_query(
			app,
			context,
			collection_name,
			special_filter_name,
			when_true_name,
			when_false_name
		);
	},
	checker_function: async function(
		context,
		[
			collection_name,
			special_filter_name,
			when_true_name,
			when_false_name = "noone",
		],
		item
	) {
		const results = await app.Datastore.aggregate(
			item.collection_name,
			(await construct_query(
				app,
				context,
				collection_name,
				special_filter_name,
				when_true_name,
				when_false_name
			))
				.match({ sealious_id: item.id })
				.toPipeline()
		);
		if (results.length) {
			return Promise.resolve();
		} else {
			return Promise.reject("No access");
		}
	},
	item_sensitive: true,
});
