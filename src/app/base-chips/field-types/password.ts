import SecureHasher from "../../../utils/secure-hasher";
import { Context, Field } from "../../../main";

const MIN_LENGTH = 8;

export default class Password extends Field {
	typeName = "password";
	async isProperValue(_: Context, input: string) {
		return input.length >= MIN_LENGTH
			? Field.valid()
			: Field.invalid(
					`Password must have at least ${MIN_LENGTH} characters`
			  );
	}

	async encode(_: Context, input: string) {
		const hash_params = this.app.ConfigManager.get("password_hash");
		const salt = SecureHasher.generateRandomSalt(hash_params.salt_length);
		return SecureHasher.hash(input, salt, hash_params);
	}

	async decode() {
		return "secret";
	}
}
