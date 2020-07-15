export type Environment = "dev" | "production";

type Config = {
	core: {
		environment: Environment;
	};
	logger: {
		level: "info" | "error" | "debug" | "emerg";
	};
	"www-server": {
		port: number;
		"api-base": string;
		"session-cookie-name": string;
		"anonymous-cookie-name": string;
		"max-payload-bytes": number;
	};
	datastore_mongo: {
		host: string;
		port: number;
		db_name: string;
		password: string;
	};
	roles: string[];
	password_hash: {
		iterations: number;
		key_length: number;
		salt_length: number;
	};
	image_formats: {};
	accout_creation_success_path: false | string;
	email: {
		from_address: string;
		from_name: string;
	};
	upload_path: string;
	smtp: {
		host: string;
		port: number;
		user: string;
		password: string;
	};
	app: {
		version: string;
	};
};

export default Config;

type RecursivePartial<T> = {
	[P in keyof T]?: RecursivePartial<T[P]>;
};

export type PartialConfig = RecursivePartial<Config>;
