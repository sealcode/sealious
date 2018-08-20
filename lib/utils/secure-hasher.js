const crypto = require("crypto");
const algorithm = "sha512";
const { promisify } = require("bluebird");

const pbkdf2 = promisify(crypto.pbkdf2);

const SecureHasher = {
	generateRandomSalt(salt_length) {
		return crypto.randomBytes(salt_length).toString("base64");
	},
	async hash(value_to_hash, salt, { iterations, key_length }) {
		const key = await pbkdf2(
			value_to_hash,
			salt,
			iterations,
			key_length,
			algorithm
		);
		return `${iterations}.${key_length}.${salt}.${key.toString("hex")}`;
	},
	matches(value, hash_with_params) {
		const [iterations, key_length, salt, hash] = hash_with_params.split(
			"."
		);

		return pbkdf2(
			value,
			salt,
			parseInt(iterations, 10),
			parseInt(key_length, 10),
			algorithm
		).then(key => key.toString("hex") === hash);
	},
};

module.exports = SecureHasher;
