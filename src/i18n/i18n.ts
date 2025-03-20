import * as assert from "assert";
import languages from "./languages/languages.js";

export default (default_language: string) => {
	assert.ok(default_language);
	assert.ok(languages[default_language]);

	return (key: string, params: unknown[]) => {
		let translation: string | null = null;
		const languageData = languages[default_language];
		if (!languageData) {
			throw new Error("default language is missing");
		}
		const languageDataKey = languageData[key];
		if (languageDataKey) {
			translation = languageDataKey(...(params || []));
		}

		return translation == null ? key : translation;
	};
};
