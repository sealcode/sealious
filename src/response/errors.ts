import type { Collection } from "../main";

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

export default class SealiousError<
	DataShape = Record<string, unknown>
> extends Error {
	is_user_fault: boolean;
	data: DataShape;
	is_developer_fault: boolean;
	sealious_error = true;
	type: string;
	message: string;
	constructor(message: string, _params?: ErrorParams, data?: any) {
		super(message);
		this.message = message;
		const params = _params || ({} as ErrorParams);
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

export class FieldsError<C extends Collection> extends SealiousError<{
	collection: C;
	field_messages: { [field in keyof C["fields"]]: { message: string } };
	other_messages: string[];
}> {
	constructor(
		collection: C,
		public field_messages: {
			[index: string]: { message: string } | undefined;
		},
		public other_messages: string[] = []
	) {
		super("Invalid field values", {
			is_user_fault: true,
			is_developer_fault: false,
			type: "validation",
			data: {
				collection: collection.name,
				field_messages,
				other_messages,
			},
		});
	}

	hasErrors(): boolean {
		return Object.keys(this.field_messages).length > 0;
	}

	getSimpleMessages(): Partial<Record<keyof C["fields"], string>> {
		return Object.fromEntries(
			Object.entries(
				this.data.field_messages as Record<string, { message: string }>
			).map(([field_name, { message }]) => [
				field_name as keyof C["fields"],
				message,
			])
		) as Partial<Record<keyof C["fields"], string>>;
	}

	static isFieldsError<C extends Collection>(
		collection: C,
		e: unknown
	): e is FieldsError<C> {
		return e instanceof FieldsError && e.data.collection == collection.name;
	}

	getErrorForField(field_name: keyof C["fields"]): string {
		return this.data.field_messages?.[field_name]?.message || "";
	}
}
