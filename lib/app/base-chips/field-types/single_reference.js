const Collection = require("../../../chip-types/collection.js");
const Promise = require("bluebird");

module.exports = function (app) {
	return {
		name: "single_reference",
		has_index: () => 1,
		is_proper_value: function (context, params, new_value) {
			const collection = new Collection(app, params.collection);
			const filter = params.filter || {};
			if (new_value === "") {
				return Promise.resolve();
			}

			let resource_id;
			if (typeof new_value === "string") {
				resource_id = new_value;
			} else if (typeof new_value === "object") {
				resource_id = new_value.id;
			}

			return collection
				.get_aggregation_stages(context, "show", { filter })
				.then((stages) => [
					{ $match: { sealious_id: resource_id } },
					...stages,
				])
				.then((stages) =>
					app.Datastore.aggregate(collection.name, stages)
				)
				.then((results) =>
					results.length > 0
						? Promise.resolve()
						: Promise.reject(
								`Nie masz dostępu do danego zasobu z kolekcji ${collection.name} lub on nie istnieje.`
						  )
				);
		},
		encode: function (context, params, value_in_code) {
			let resource_id;
			if (typeof value_in_code === "string") {
				resource_id = value_in_code;
			} else if (typeof value_in_code === "object") {
				resource_id = value_in_code.id;
			}
			return resource_id;
		},
		filter_to_query: async function (context, params, field_filter) {
			// treating filter as a query here
			if (typeof field_filter !== "object") {
				return {
					$eq: field_filter,
				};
			}
			const collection = new Collection(app, params.collection);
			const { items } = await app.run_action(
				context,
				["collections", collection.name],
				"show",
				{
					filter: field_filter,
				}
			);
			return { $in: items.map((resource) => resource.id) };
		},
		get_aggregation_stages: function (
			context,
			params,
			field_name,
			field_value_path,
			query
		) {
			const collection = new Collection(app, params.collection);
			const filter = {};
			const temp_field_name =
				collection.name +
				"-" +
				"lookup" +
				Math.floor(Math.random().toString() * Math.pow(10, 7));
			const request_filter = query.filter && query.filter[field_name];
			if (!request_filter || Object.keys(request_filter).length === 0)
				return [];
			if (typeof request_filter === "string") {
				return [{ $match: { [field_value_path]: request_filter } }];
			}
			if (request_filter instanceof Array) {
				let _in = request_filter;
				if (request_filter[0] instanceof Array) _in = request_filter[0];
				return [
					{
						$match: {
							[field_value_path]: { $in: _in },
						},
					},
				];
			}
			for (let field_name in request_filter) {
				let field = collection.fields[field_name];
				if (!field)
					return Promise.reject(
						"Unknown field in filter for '" +
							collection.name +
							"': " +
							field_name
					);
				filter[
					`${temp_field_name}.0.${field_name}`
				] = field.filter_to_query(context, request_filter[field_name]);
			}
			return Promise.props(filter).then(function (_filter) {
				return [
					{
						$lookup: {
							from: collection.name,
							localField: field_value_path,
							foreignField: "sealious_id",
							as: temp_field_name,
						},
					},
					{ $match: _filter },
				];
			});
		},
		get_attachment_loader: function (context, omit_it, name, params) {
			return new app.Attachments.ReferenceToCollection(
				context,
				name,
				params
			);
		},
	};
};
