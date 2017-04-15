"use strict";
const locreq = require("locreq")(__dirname);
const Collection = locreq("lib/chip-types/collection.js");
const Promise = require("bluebird");

module.exports = function(app) {
    return {
        name: "single_reference",
        has_index: () => 1,
        is_proper_value: function(context, params, new_value) {
            const collection = new Collection(app, params.collection);
            if (new_value === "") {
                return Promise.resolve();
            }
            let resource_id;
            if (typeof new_value === "string") {
                resource_id = new_value;
            } else if (typeof new_value === "object") {
                resource_id = new_value.id;
            }
            return app
                .run_action(
                    context,
                    ["collections", collection.name, resource_id],
                    "show"
                )
                .catch({ type: "not_found" }, error =>
                    Promise.reject(error.message));
        },
        encode: function(context, params, value_in_code) {
            let resource_id;
            if (typeof value_in_code === "string") {
                resource_id = value_in_code;
            } else if (typeof value_in_code === "object") {
                resource_id = value_in_code.id;
            }
            return resource_id;
        },
        format: function(context, params, decoded_value, format) {
            // format can be "expand" or "deep-expand:<depth>", like "deep-expand:3"
            if (!format) {
                return decoded_value; // just the ID
            }

            if (decoded_value === "") {
                return null; // no reference here;
            }

            const format_params = format.split(":");

            if (
                format_params[0] === "expand" ||
                format_params[0] === "deep-expand"
            ) {
                if (decoded_value === undefined) {
                    return undefined;
                }
                const collection = new Collection(app, params.collection);
                const resource_id = decoded_value;
                const query_format = {};
                if (
                    format_params[0] === "deep-expand" && format_params[1] > 1
                ) {
                    for (const field_name in collection.fields) {
                        const field = collection.fields[field_name];
                        if (field.type.name === "single_reference") {
                            query_format[
                                field_name
                            ] = `deep-expand:${parseInt(format_params[1]) - 1}`;
                        }
                    }
                }
                return app.run_action(
                    context,
                    ["collections", collection.name, resource_id],
                    "show",
                    { format: query_format }
                );
            } else {
                return decoded_value;
            }
        },
        filter_to_query: function(context, params, field_filter) {
            // treating filter as a query here
            if (typeof field_filter === "object") {
                const collection = new Collection(app, params.collection);
                return app
                    .run_action(
                        context,
                        ["collections", collection.name],
                        "show",
                        { filter: field_filter }
                    )
                    .map(function(resource) {
                        return resource.id;
                    })
                    .then(function(id_array) {
                        return {
                            $in: id_array,
                        };
                    });
            } else {
                return {
                    $eq: field_filter,
                };
            }
        },
        get_aggregation_stages: function(context, params, field_name, query) {
            const collection = new Collection(app, params.collection);
            const filter = {};
            const temp_field_name = collection.name +
                "-" +
                "lookup" +
                Math.floor(Math.random().toString() * Math.pow(10, 7));
            const request_filter = query.filter && query.filter[field_name];
            if (!request_filter || Object.keys(request_filter).length === 0)
                return [];
            if (typeof request_filter === "string") {
                return [{ $match: { ["body." + field_name]: request_filter } }];
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
                    temp_field_name + ".0.body." + field_name
                ] = field.type.filter_to_query(
                    context,
                    params,
                    request_filter[field_name]
                );
            }
            return Promise.props(filter).then(function(_filter) {
                return [
                    {
                        $lookup: {
                            from: collection.name,
                            localField: "body." + field_name,
                            foreignField: "sealious_id",
                            as: temp_field_name,
                        },
                    },
                    { $match: _filter },
                ];
            });
        },
    };
};
