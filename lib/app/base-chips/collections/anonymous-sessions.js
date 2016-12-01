const AnonymousSessions = {
	name: "anonymous-sessions",
	fields: [
		{name: "anonymous-session-id", type: "session-id", required: true},
		{name: "anonymous-user-id", type: "shortid", required: true},
	],
	access_strategy: {
		default: "super",
	}
};

module.exports = AnonymousSessions;
