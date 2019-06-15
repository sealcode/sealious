"use strict";
const get_request_body = require("./get-request-body.js");
const http_to_subject_method = require("./http-to-method-name.js");
const extract_context = require("./extract-context.js");
const handle_response = require("./handle-response.js");
const handle_error = require("./handle-error.js");
const SealiousResponse = require("../../common_lib/response/sealious-response.js");
const ID_INDEX = 2;

async function handle_request(app, request, h) {
	try {
		const path_elements = parsePathElements(request);
		const action_name =
			http_to_subject_method[request.method.toUpperCase()];
		const context = await extract_context(app, request);
		const body = get_request_body(context, request);

		return app
			.run_action(context, path_elements, action_name, body)
			.then(
				response =>
					response instanceof SealiousResponse
						? response.toObject()
						: response
			)
			.then(result => handle_response(app, context, h)(result))
			.catch(result => handle_error(app, h)(result));
	} catch (error) {
		app.Logger.error(error);
		return error;
	}
}

function parsePathElements(request) {
	const path_elements = request.params.elements.split("/");
	if (path_elements[ID_INDEX] && path_elements[ID_INDEX].includes("+")) {
		path_elements[ID_INDEX] = path_elements[ID_INDEX].split("+");
	}

	return path_elements;
}

module.exports = handle_request;
