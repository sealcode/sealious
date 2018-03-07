"use strict";
var Promise = require("bluebird");
const merge = require("merge");

function createIndex(db_collection, index) {
	return Promise.promisify(db_collection.createIndex).bind(db_collection)(
		index,
		{ background: true }
	);
}

var DatabasesCommonPart = function(app, datastore, _private) {
	datastore.post_start = function() {
		const collection_names = app.ChipManager.get_all_collections();
		const collections = collection_names.map(name =>
			app.ChipManager.get_chip("collection", name)
		);
		return Promise.map(collections, function(collection) {
			let indexes = [["sealious_id", 1]];
			for (var field_name in collection.fields) {
				indexes.push(
					Promise.all([
						"body." + field_name,
						collection.fields[field_name].has_index(),
					])
				);
			}
			const db_collection = _private.db.collection(collection.name);
			return Promise.all(indexes)
				.then(function(collection_indexes) {
					const all_indexes = collection_indexes
						.filter(e => e[1] !== false)
						.map(function(index) {
							if (index[1] instanceof Object) {
								const ret = [];
								for (const i in index[1]) {
									ret.push([index[0] + "." + i, index[1][i]]);
								}
								return ret;
							} else {
								return [index];
							}
						})
						.reduce((a, b) => a.concat(b), []);

					const non_text_indexes = all_indexes
						.filter(e => e[1] !== "text")
						.map(e => {
							return { [e[0]]: e[1] };
						});

					// if multiple fields take part in full text search, we need to combine them into a single index.

					let text_indexes = [
						all_indexes
							.filter(e => e[1] === "text")
							.reduce(
								(a, b) => merge(true, a, { [b[0]]: b[1] }),
								{}
							),
					];
					if (Object.keys(text_indexes[0]).length == 0) {
						text_indexes = [];
					}

					const merged_indexes = text_indexes.concat(
						non_text_indexes
					);

					return merged_indexes;
				})
				.each(function(index) {
					return createIndex(db_collection, index).catch(
						e => e.code == 85,
						function(error) {
							const index_name = error.message
								.match(/name: \"([^\"]+)\"/g)[1]
								.replace('name: "', "")
								.replace('"', "");
							return Promise.promisify(db_collection.dropIndex)
								.bind(db_collection)(index_name)
								.then(() => createIndex(db_collection, index));
						}
					);
				});
		});
	};

	function process_query(query) {
		if (!query) {
			return {};
		}
		var new_query = {};
		for (var attribute_name in query) {
			if (attribute_name == "sealious_id") {
				new_query[attribute_name] = query[attribute_name];
			} else {
				if (query[attribute_name] instanceof Object) {
					if (attribute_name[0] === "$") {
						new_query[attribute_name] = query[attribute_name];
					} else {
						for (var i in query[attribute_name]) {
							new_query[attribute_name + "." + i] =
								query[attribute_name][i];
						}
					}
				} else {
					new_query[attribute_name] = query[attribute_name];
				}
			}
		}
		return new_query;
	}

	datastore.find = function(collection_name, query, options, output_options) {
		//console.log("FIND", collection_name, query);
		//query = process_query(query); // - needed, ResourceCollection subject handles that now
		options = options || {};
		output_options = output_options || {};
		var cursor = _private.db
			.collection(collection_name)
			.find(query, options);
		if (output_options.sort) {
			cursor.sort(output_options.sort);
		}
		if (output_options.skip) {
			cursor.skip(output_options.skip);
		}
		if (output_options.amount) {
			cursor.limit(output_options.amount);
		}
		return Promise.promisify(cursor.toArray).bind(cursor)();
	};

	datastore.aggregate = function(
		collection_name,
		pipeline,
		options,
		output_options
	) {
		//console.log("aggregate", collection_name, JSON.stringify(pipeline));
		options = options || {};
		output_options = output_options || {};
		const cursor = _private.db
			.collection(collection_name)
			.aggregate(pipeline);

		if (output_options.sort) {
			cursor.sort(output_options.sort);
		}
		if (output_options.skip) {
			cursor.skip(output_options.skip);
		}
		if (output_options.amount) {
			cursor.limit(output_options.amount);
		}

		return Promise.promisify(cursor.toArray).bind(cursor)();
	};

	datastore.insert = function(collection_name, to_insert, options) {
		return Promise.promisify(_private.db.collection(collection_name).insert)
			.bind(_private.db.collection(collection_name))(to_insert, options)
			.then(function(result) {
				return result.ops[0];
			});
	};

	datastore.update = function(collection_name, query, new_value) {
		query = process_query(query);
		return new Promise(function(resolve, reject) {
			_private.db
				.collection(collection_name)
				.update(query, new_value, function(err, WriteResult) {
					if (err) {
						reject(err);
					} else {
						resolve(WriteResult);
					}
				});
		});
	};

	datastore.remove = function(collection_name, query, just_one) {
		query = process_query(query);
		//console.log("Removing!", query);
		return new Promise(function(resolve, reject) {
			if (just_one === undefined) {
				just_one = 0;
			}
			just_one = just_one ? 1 : 0;
			_private.db
				.collection(collection_name)
				.remove(query, just_one, function(err, delete_response) {
					if (err) {
						reject(err);
					} else {
						resolve(delete_response);
					}
				});
		});
	};

	datastore.createIndex = function(collection_name, index, options) {
		const collection = _private.db.collection(collection_name);
		return Promise.promisify(collection.createIndex).bind(collection)(
			index,
			options
		);
	};
};

module.exports = DatabasesCommonPart;
