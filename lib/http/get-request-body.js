"use strict";
const merge = require("merge");
const Sealious = require("../../lib/main");

const squares = {
	set: function(obj, key, value) {
		const keys = key.split(/[\]\[]{1,2}/g);
		if (keys.length > 1) {
			keys.splice(-1); //to remove the trailing empty string;
		}
		const last_key = keys[keys.length - 1];
		let current = obj;
		for (let i = 0; i < keys.length - 1; i++) {
			const key = keys[i];
			const next_key = keys[i + 1];
			if (current[key] === undefined) {
				if (next_key === "") {
					current[key] = [];
				} else {
					current[key] = {};
				}
			}
			current = current[key];
		}
		if (last_key === "") {
			current.push(value);
		} else {
			current[last_key] = value;
		}
	},
};

function get_request_body(context, request) {
	const parsed_query = {};
	for (const i in request.query) {
		squares.set(parsed_query, i, request.query[i]);
	}
	for (const i in request.payload) {
		squares.set(parsed_query, i, request.payload[i]);
	}
	for (var i in request.payload) {
		if (
			request.payload[i] &&
			request.payload[i].payload &&
			request.payload[i].payload instanceof Buffer
		) {
			let filename = request.payload[i].filename;
			var mime_type = request.payload[i].headers["content-type"];
			var data = request.payload[i].payload;
			parsed_query[i] = new Sealious.File(
				context,
				filename,
				data,
				null,
				mime_type
			);
		}
	}
	return parsed_query;
}

const a = {};

module.exports = get_request_body;
