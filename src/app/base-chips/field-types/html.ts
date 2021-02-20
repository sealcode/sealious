import Text from "./text";

/** A field that stores text meant to be an HTML fragment. Unlike {@link Text}, html-like characters aren't escaped, but instead the content is subject to html sanitization to prevent XSS.
 *
 * **Params**: see {@link TextStorage}
 */
export default class Html extends Text {
	getTypeName = () => "html";
	async encode(_: any, input: string) {
		if (input === null) {
			return null;
		}
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
