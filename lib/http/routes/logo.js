module.exports = app => {
	app.WwwServer.custom_raw_route({
		method: ["GET"],
		path: "/api/v1/logo",
		handler: { file: { path: app.manifest.logo } },
	});
};
