module.exports = function(app, context, h) {
	const config = app.ConfigManager.get("www-server");
	return function(response) {
		let rep = null;
		if (response instanceof app.Sealious.File) {
			rep = h
				.file(response.path_on_hdd, { confine: false })
				.type(response.mime)
				.header("Cache-Control", "max-age=6000, must-revalidate");
		} else if (response instanceof app.Sealious.Responses.NewSession) {
			rep = h
				.response(response)
				.state(
					config["session-cookie-name"],
					response.metadata.session_id
				);
		} else if (response instanceof app.Sealious.Responses.ResourceCreated) {
			rep = h.response(response).code(201);
		} else if (response instanceof app.Sealious.VirtualFile) {
			rep = h.response(response.content).type(response.mime);
		} else {
			rep = h.response(response);
		}
		rep.state(
			config["anonymous-cookie-name"],
			context.anonymous_session_id
		);

		return rep;
	};
};
