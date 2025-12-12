import * as assert from "assert";

export interface ManifestData {
	name: string;
	logo: string;
	version: string;
	default_language: string;
	base_url: string;
	admin_email: string;
	rss_variants?: string[][];
	colors: { primary: string };
}

export default class Manifest implements ManifestData {
	name: string;
	logo: string;
	version: string;
	default_language: string;
	base_url: string;
	admin_email: string;
	colors: { primary: string };
	rss_variants?: string[][];
	constructor(public data: ManifestData) {
		Object.assign(this, data);
	}

	validate() {
		assert.ok(this.data, "Please provide the app manifest");
		[
			"name",
			"logo",
			"version",
			"default_language",
			"base_url",
			"admin_email",
		].forEach((key: keyof ManifestData) => {
			assert.ok(
				this.data[key],
				`Please specify '${key}' field in the app manifest`
			);
		});
	}
}
