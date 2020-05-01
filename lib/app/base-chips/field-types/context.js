const Context = require("../../../context.js");

module.exports = {
	name: "context",
	is_proper_value: function (context, params, value) {
		if (value instanceof Context) {
			return Promise.resolve();
		} else {
			return Promise.reject(
				"Provided value is not an instance of Sealious.Context"
			);
		}
	},
};
