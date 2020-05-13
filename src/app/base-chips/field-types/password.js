"use strict";
const Promise = require("bluebird");
const SecureHasher = require("../../../utils/secure-hasher.js");
const crypto = require("crypto");

module.exports = app => ({
	name: "password",
	extends: "text",
	get_description: function(context, { digits, capitals }) {
		let message = "Stores a password in a correct way";
		if (!digits && !capitals) {
			return message;
		}
		message += " with ";

		if (digits) {
			message += `required digits: ${digits} `;
		}

		if (capitals) {
			message += `required capitals: ${capitals} `;
		}

		return message;
	},
	is_proper_value: function(context, { digits, capitals }, new_value) {
		const pattern_array = [];
		if (!digits && !capitals) {
			return Promise.resolve();
		}
		if (digits) {
			pattern_array.push(new RegExp(`(.*[0-9]+.*){${digits}}`));
		}
		if (capitals) {
			pattern_array.push(new RegExp(`(.*[A-Z]+.*){${capitals}}`));
		}

		const isAccepted = pattern_array
			.map(n => n.test(new_value))
			.reduce((a, b) => a && b, true);

		if (isAccepted) {
			return Promise.resolve();
		} else {
			const digits = digits || "0";
			const capitals = capitals || "0";
			return Promise.reject(
				`It didn't fulfill the requirements: required digits - ${digits} , required capitals ${capitals}`
			);
		}
	},
	encode: function(context, params, value_in_code) {
		const hashing_params = Object.assign(
			{},
			app.ConfigManager.get("password_hash"),
			params
		);
		const salt = SecureHasher.generateRandomSalt(
			hashing_params.salt_length
		);
		return SecureHasher.hash(value_in_code, salt, hashing_params);
	},
	get_aggregation_stages: require("./../../../chip-types/field-type-default-methods.js")
		.get_aggregation_stages,
	decode: function(context, params, value_in_db) {
		return null;
	},
	format: function(context, params, decoded_value, format_params) {
		return decoded_value;
	},
});
