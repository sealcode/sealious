import getRequestBody from "./get-request-body";
import http_to_subject_method from "./http-to-method-name";
import extractContext from "./extract-context";
import handleResponse from "./handle-response";
import handleError from "./handle-error";
import App from "../app/app";
import { NotFound } from "../response/errors";
const ID_INDEX = 2;

export default async function handle_request(app: App, request: any, h: any) {
	const path_elements = parsePathElements(request);
	const action_name =
		http_to_subject_method[
			request.method.toUpperCase() as keyof typeof http_to_subject_method
		];
	const context = await extractContext(app, request);
	const body = await getRequestBody(app, context, request);

	app.Logger.info(
		"REQUEST",
		`${request.method.toUpperCase()} ${request.params.elements}`,
		body,
		3
	);
	const subject = await app.RootSubject.getSubject(path_elements);
	if (!subject) {
		throw new NotFound("Subject not found: " + path_elements.toString());
	}
	return subject
		.performAction(context, action_name, body)
		.then((result) => handleResponse(app, context, h)(result))
		.catch((result) => handleError(app)(result));
}

function parsePathElements(request: any) {
	const path_elements = request.params.elements.split("/");
	if (path_elements[ID_INDEX] && path_elements[ID_INDEX].includes("+")) {
		path_elements[ID_INDEX] = path_elements[ID_INDEX].split("+");
	}

	return path_elements;
}
