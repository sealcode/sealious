"use strict";
const Sealious = require("../../lib/main");
const get_request_body = require("./get-request-body.js");
const http_to_subject_method = require("./http-to-method-name.js");
const error_to_boom = require("./error-to-boom.js");
const extract_context = require("./extract-context.js");
const handle_response = require("./handle-response.js");
const handle_error = require("./handle-error.js");

function handle_request(app, request, reply) {
	try {
		const config = app.ConfigManager.get_config()["www-server"];
		var path_elements = request.params.elements.split("/");
		var action_name = http_to_subject_method[request.method.toUpperCase()];
		let context = null;

		return extract_context(app, request)
			.then(function(_context) {
				context = _context;
				let body = get_request_body(context, request);
				return app.run_action(
					context,
					path_elements,
					action_name,
					body
				);
			})
			.then(result => handle_response(app, context, reply)(result))
			.catch(result => handle_error(app, reply)(result));
	} catch (error) {
		app.Logger.error(error);
		reply(error);
		return null;
	}
}

module.exports = handle_request;
