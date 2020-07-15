import * as assert from "assert";
import languages from "./languages/languages";

export default (default_language: string) => {
	assert.ok(default_language);
	assert.ok(languages[default_language]);

	return (key: string, params: any[]) => {
		let translation: string;
		if (languages[default_language][key]) {
			translation = languages[default_language][key](params);
		} else {
			translation = key;
		}
		return translation;
	};
};
