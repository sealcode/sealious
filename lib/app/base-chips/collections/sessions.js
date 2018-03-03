const Sessions = {
	name: "sessions",
	fields: [
		{name: "session-id", type: "session-id"},
		{name: "user", type: "single_reference", params: {collection: "users"}},
	],
	access_strategy: {
		default: "super",
	}
};

module.exports = Sessions;
