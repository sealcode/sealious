import { Field, Context } from "../../../main";

const email = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

/** Stores an email address. Rejects values not formatted as an email address. Doesn't provide any configuration or advanced filters */
export default class Email extends Field<string, string> {
	getTypeName = () => "email";
	async isProperValue(_: Context, value: string) {
		if (email.test(value) || value === "") {
			return Field.valid();
		} else {
			return Field.invalid(`${value} is a not valid e-mail address.`);
		}
	}
}
