import type SealiousError from "./errors";

class Response {
	status: "error" | "success";
	type: string;
	status_message: string;
	data: any;
	constructor(
		data: any,
		is_error: boolean,
		type: string,
		status_message: string
	) {
		this.status = is_error ? "error" : "success";
		this.type = type || "response";
		this.status_message = status_message || "ok";
		this.data = data || {};
	}
	static fromError(sealious_error: SealiousError) {
		return {
			data: sealious_error.data || {},
			is_error: true,
			type: sealious_error.type,
			status_message: sealious_error.message,
			message: sealious_error.message,
		};
	}
}

module.exports = Response;
