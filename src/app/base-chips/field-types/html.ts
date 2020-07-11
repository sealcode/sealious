import Text from "./text";

export default class Html extends Text {
	getTypeName = () => "html";
	async encode(_: any, input: string) {
		const sanitizeHtml = require("sanitize-html"); //putting it here not to slow down `new Sealious.app()`
		return {
			original: input,
			safe: sanitizeHtml(input, {
				allowedTags: sanitizeHtml.defaults.allowedTags.concat([
					"img",
					"h1",
					"h2",
				]),
			}),
		};
	}
}
