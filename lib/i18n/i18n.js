const assert = require("assert");
const languages = require("./languages/languages");

module.exports = default_language => {
	assert(default_language);
	assert(languages[default_language]);

	return (key, params) => languages[default_language][key](params);
};
