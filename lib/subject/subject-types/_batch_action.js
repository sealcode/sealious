"use strict";
const Promise = require("bluebird");
const locreq = require("locreq")(__dirname);
const ArrayCartesian = locreq("lib/utils/array-cartesian.js");
const PromiseIterateGenerator = locreq("lib/utils/promise-iterate-generator.js");

module.exports = function batch_action(app, context, params, callback){
	// callback is a function that will be called for each instance infered from the description, taking context and inferred body as arguments
	const mode = params.mode || "batch";  // can be: "cartesian" or "batch";
	if(mode === "batch"){
		throw new Error("BATCH mode not implemented yet");
	}
	if(mode === "cartesian"){
		const field_names = [];
		const possible_field_values = [];
		const to_await = [];
		for(const i in params.sources){
			const source = params.sources[i];
			if(source[0] === "literal"){
				for(const field_name in source[1]){
					field_names.push(field_name);
					possible_field_values.push([source[1][field_name]]);
				}
			}else if(source[0] === "collection_fields"){
				const collection_name = source[1].collection;
				const filter = source[1].filter || {};
				const fields = source[1].fields || [];
				const map_to = source[1].map_to;
				const promise = app.run_action(
					context,
					["collections", collection_name],
					"show",
					{filter: filter}
				).then(function(resources){
					for(const i in map_to){
						const field_in_collection = fields[i];
						const field_name = map_to[i];
						field_names.push(field_name);
						possible_field_values.push(
							resources.map((resource)=>{
								if(field_in_collection === "id"){
									return resource.id;
								}else{
									return resource.body[field_in_collection];
								}
							})
						);
					}
				});
				to_await.push(promise);
			}
		}
		return Promise.all(to_await)
		.then(function(){
			return PromiseIterateGenerator(
				new ArrayCartesian(possible_field_values),
				function(values){
					const body = {};
					for(const i in field_names){
						body[field_names[i]] = values[i];
					}
					return callback(context, body);
				}
			);
		});
	}
};
