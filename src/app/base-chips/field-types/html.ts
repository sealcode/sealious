import Text from "./text.js";

/** A field that stores text meant to be an HTML fragment. Unlike {@link Text}, html-like characters aren't escaped, but instead the content is subject to html sanitization to prevent XSS.
 *
 * **Params**: see {@link TextStorage}
 */
export default class Html extends Text {
	typeName = "html";
	getTypeName = () => "html";
	async encode(_: any, input: string) {
		if (input === null) {
			return null;
		}
		return input;
	}
}
