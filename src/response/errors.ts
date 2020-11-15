export type ErrorParams = {
	is_user_fault: boolean;
	type: string;
	is_developer_fault: boolean;
	data: any;
};

export interface ErrorLikeObject {
	message: string;
	type: string;
	data: any;
}

export default class SealiousError extends Error {
	is_user_fault: boolean;
	data: any;
	is_developer_fault: boolean;
	sealious_error = true;
	type: string;
	message: string;
	constructor(message: string, _params?: ErrorParams, data?: any) {
		super(message);
		this.message = message;
		let params = _params || ({} as ErrorParams);
		this.is_user_fault = params?.is_user_fault || false;
		this.type = params.type === undefined ? "error" : params.type;
		this.data = data || params.data || {};
		this.is_developer_fault =
			params.is_developer_fault === undefined
				? false
				: params.is_developer_fault;
	}

	toObject(): ErrorLikeObject {
		return {
			message: this.message,
			type: this.type,
			data: this.data,
		};
	}
}

export class ValidationError extends SealiousError {
	constructor(message: string, params: Partial<ErrorParams> = {}) {
		super(message, {
			data: params,
			is_user_fault: true,
			type: "validation",
			is_developer_fault: false,
		});
	}
}

export class ValueExists extends SealiousError {
	constructor(message: string, params?: any) {
		super(message, {
			...params,
			is_user_fault: true,
			type: "value_exists",
		});
	}
}

export class InvalidCredentials extends SealiousError {
	constructor(message: string, params?: any) {
		super(message, {
			...params,
			is_user_fault: true,
			type: "invalid_credentials",
		});
	}
}

export class NotFound extends SealiousError {
	constructor(message: string, params?: any) {
		super(message, {
			...params,
			is_user_fault: true,
			type: "not_found",
		});
	}
}

export class DeveloperError extends SealiousError {
	constructor(message: string, params?: any) {
		super(message, {
			...params,
			is_user_fault: false,
			is_developer_fault: true,
			type: "dev_error",
		});
	}
}

export class BadContext extends SealiousError {
	constructor(message: string, params?: any) {
		super(message, {
			...params,
			is_user_fault: true,
			type: "permission",
		});
	}
}

export class ServerError extends SealiousError {
	constructor(message: string, params?: any) {
		super(message, {
			...params,
			is_user_fault: false,
			is_developer_fault: false,
			type: "server_error",
		});
	}
}

export class BadSubjectPath extends SealiousError {
	constructor(message: string, params?: any) {
		super(message, {
			...params,
			is_user_fault: true,
			type: "bad_subject",
		});
	}
}

export class BadSubjectAction extends SealiousError {
	constructor(message: string, params?: any) {
		super(message, {
			...params,
			is_user_fault: true,
			type: "bad_subject_action",
		});
	}
}

export class FieldDoesNotSupportAttachments extends SealiousError {
	constructor(message: string, params?: any) {
		super(message, {
			...params,
			is_user_fault: true,
			type: "field_does_not_support_attachments",
		});
	}
}
