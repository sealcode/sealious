import { Field, Context } from "../../../main.js";
import { OpenApiTypes } from "../../../schemas/open-api-types.js";

const email =
	/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

/** Stores an email address. Rejects values not formatted as an email address. Doesn't provide any configuration or advanced filters */
export default class Email extends Field<string> {
	typeName = "email";

	open_api_type: OpenApiTypes = OpenApiTypes.EMAIL;

	async isProperValue(context: Context, value: string) {
		if (email.test(value) || value === "") {
			return Field.valid();
		} else {
			return Field.invalid(
				context.i18n`${value} is a not valid e-mail address.`
			);
		}
	}

	async decode(
		_: Context,
		storage_value: string | null
	): Promise<string | null> {
		return storage_value;
	}

	getPostgreSqlFieldDefinitions(): string[] {
		return [`"${this.name}" VARCHAR`];
	}
}
