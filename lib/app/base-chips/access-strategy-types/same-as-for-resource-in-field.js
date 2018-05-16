const Query = require("../../../datastore/query.js");

module.exports = app => ({
	name: "same-as-for-resource-in-field",
	getRestrictingQuery: async function(
		context,
		{ action_name, collection, field }
	) {
		const referenced_collection = get_referenced_collection(
			app,
			collection,
			field
		);
		const referenced_access_strategy = get_referenced_access_strategy(
			app,
			action_name,
			field,
			referenced_collection
		);
		const referenced_restricting_query = await referenced_access_strategy.getRestrictingQuery(
			context
		);

		if (
			referenced_restricting_query instanceof Query.DenyAll ||
			referenced_restricting_query instanceof Query.AllowAll
		) {
			return referenced_restricting_query;
		}

		const query = new Query();
		const parent_prefix = query.lookup({
			from: referenced_collection,
			localField: `body.${field}`,
			foreignField: "sealious_id",
		});

		const referenced_restricting_pipeline = referenced_restricting_query.toPipeline();
		add_parent_prefix_to_pipeline(
			referenced_restricting_pipeline,
			parent_prefix
		);

		const pipeline = query
			.toPipeline()
			.concat(referenced_restricting_pipeline);

		return Query.fromCustomPipeline(pipeline);
	},
	checker_function: async function(
		context,
		{ action_name, collection, field },
		item
	) {
		const referenced_collection = get_referenced_collection(
			app,
			collection,
			field
		);
		const referenced_access_strategy = get_referenced_access_strategy(
			app,
			action_name,
			field,
			referenced_collection
		);

		const referenced_item = await app.run_action(
			new app.Sealious.SuperContext(),
			["collections", referenced_collection, item.body[field]],
			"show"
		);

		return referenced_access_strategy.check(context, referenced_item);
	},
	item_sensitive: true,
});

function get_referenced_collection(app, collection, field_name) {
	const field = app.ChipManager.get_chip("collection", collection).fields[
		field_name
	];
	return field.params.collection;
}

function get_referenced_access_strategy(
	app,
	action_name,
	field,
	referenced_collection
) {
	return app.ChipManager.get_chip(
		"collection",
		referenced_collection
	).get_access_strategy(action_name);
}

function add_parent_prefix_to_pipeline(pipeline, parent_property) {
	for (let stage of pipeline) {
		add_parent_prefix(stage, parent_property);
	}
}

const prop_regex = /^[a-z0-9_]/;
function add_parent_prefix(group, parent_property) {
	return Object.keys(group).reduce((acc, prop) => {
		if (Array.isArray(group[prop])) {
			group[prop] = group[prop].map(subgroup =>
				add_parent_prefix(subgroup, parent_property)
			);
		} else if (group[prop] instanceof Object) {
			group[prop] = add_parent_prefix(group[prop], parent_property);
		}
		const new_prop = prop_regex.test(prop)
			? parent_property + "." + prop
			: prop;
		acc[new_prop] = group[prop];
		return acc;
	}, {});
}
