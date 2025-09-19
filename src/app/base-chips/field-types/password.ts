import SecureHasher from "../../../utils/secure-hasher.js";
import { Context, Field } from "../../../main.js";
import { OpenApiTypes } from "../../../schemas/open-api-types.js";

const MIN_LENGTH = 8;

export default class Password extends Field<string> {
	typeName = "password";

	open_api_type: OpenApiTypes = OpenApiTypes.PASSWORD;

	async isProperValue(context: Context, input: string) {
		return input.length >= MIN_LENGTH
			? Field.valid()
			: Field.invalid(context.app.i18n("invalid_password", [MIN_LENGTH]));
	}

	async encode(_: Context, input: string) {
		if (input === null) {
			return null;
		}
		const hash_params = this.app.ConfigManager.get("password_hash");
		const salt = SecureHasher.generateRandomSalt(hash_params.salt_length);
		return SecureHasher.hash(input, salt, hash_params);
	}

	async decode() {
		return "secret";
	}

	getPostgreSqlFieldDefinitions(): string[] {
		return [`"${this.name}" VARCHAR`];
	}

	hasDefaultValue(): boolean {
		return false;
	}
}
