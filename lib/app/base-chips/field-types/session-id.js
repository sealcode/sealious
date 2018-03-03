const uuid = require("node-uuid").v4;

const session_id = {
	name: "session-id",
	is_proper_value: () => Promise.resolve(),
	encode: (context, params, value) => value? value : uuid(),
	decode: (context, params, value) => value,
};

module.exports = session_id;
