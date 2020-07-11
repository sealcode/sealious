const languages: { [lang: string]: { [key: string]: Function } } = {
	pl: require("./pl"),
	en: require("./en"),
};

export default languages;
