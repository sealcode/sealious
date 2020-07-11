import getRequestBody from "./get-request-body";
import http_to_subject_method from "./http-to-method-name";
import extractContext from "./extract-context";
import handleResponse from "./handle-response";
import handleError from "./handle-error";
import SealiousResponse from "../../common_lib/response/sealious-response";
import App from "../app/app";
const ID_INDEX = 2;

export default async function handle_request(app: App, request: any, h: any) {
	try {
		const path_elements = parsePathElements(request);
		const action_name =
			http_to_subject_method[
				request.method.toUpperCase() as keyof typeof http_to_subject_method
			];
		const context = await extractContext(app, request);
		const body = await getRequestBody(app, context, request);

		return app
			.runAction(context, path_elements, action_name, body)
			.then((response) =>
				response instanceof SealiousResponse
					? response.toObject()
					: response
			)
			.then((result) => handleResponse(app, context, h)(result))
			.catch((result) => handleError(app)(result));
	} catch (error) {
		app.Logger.error(error);
		return error;
	}
}

function parsePathElements(request: any) {
	const path_elements = request.params.elements.split("/");
	if (path_elements[ID_INDEX] && path_elements[ID_INDEX].includes("+")) {
		path_elements[ID_INDEX] = path_elements[ID_INDEX].split("+");
	}

	return path_elements;
}
