const assert = require("assert");
const languages = require("./languages/languages");

module.exports = default_language => {
	assert(default_language);
	assert(languages[default_language]);

	return (key, params) => {
		let translation;
		if (languages[default_language][key]) {
			translation = languages[default_language][key](params);
		} else {
			translation = key;
		}
		return {
			toString: () => translation,
			capitalize: () =>
				translation[0].toUpperCase() + translation.slice(1),
		};
	};
};
