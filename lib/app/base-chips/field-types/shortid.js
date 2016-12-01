const shortid = require("shortid");

const shortid_ft = {
	name: "shortid",
	is_proper_value: () => Promise.resolve(),
	encode: (context, params, value) => value? value : shortid.generate(),
	decode: (context, params, value) => value,
};

module.exports = shortid_ft;
