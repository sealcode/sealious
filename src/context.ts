import App from "./app/app";

import Item from "../common_lib/response/item";

export default class Context {
	timestamp: number;
	ip: string | null;
	user_id: string | null;
	anonymous_user_id: string | null;
	user_data: null | Promise<Item> = null;
	loading_user_data: boolean;
	session_id: string | null;
	anonymous_session_id: string | null;
	anon_session_is_new: boolean | null;
	is_super = false;
	original_context: Context | null;

	constructor(
		public app: App,
		timestamp: number = Date.now(),
		ip?: string | null,
		user_id?: string | null,
		session_id?: string | null,
		anonymous_session_id?: string | null,
		anon_session_is_new?: boolean | null,
		anonymous_user_id?: string | null
	) {
		this.original_context = this;
		this.loading_user_data = false;
		this.timestamp = timestamp;
		this.ip = ip || null;
		this.user_id = user_id || null;
		this.anonymous_user_id = anonymous_user_id || null;
		this.session_id = session_id || null;
		this.anonymous_session_id = anonymous_session_id || null;
		this.anon_session_is_new = anon_session_is_new || null;
		this.anonymous_user_id = anonymous_user_id || null;
	}

	async getUserData(app: App): Promise<Item | null> {
		if (this.user_data) {
			return this.user_data;
		}

		if (this.user_id === null) {
			return null;
		}
		const c = new SuperContext(this);
		this.user_data = app.runAction(
			c,
			["collections", "users", this.user_id],
			"show"
		);
		return this.user_data;
	}

	toDBEntry() {
		return {
			timestamp: this.timestamp,
			ip: this.ip,
			user_id: this.user_id,
			session_id: this.session_id,
			anonymous_session_id: this.anonymous_session_id,
			anon_session_is_new: this.anon_session_is_new,
			anonymous_user_id: this.anonymous_user_id,
		};
	}
}

export class SuperContext extends Context {
	is_super = true;
	constructor(arg0: Context | App) {
		super(
			arg0 instanceof Context ? arg0.app : arg0,
			(arg0 as Context)?.timestamp,
			(arg0 as Context)?.ip,
			(arg0 as Context)?.user_id,
			(arg0 as Context)?.session_id,
			(arg0 as Context)?.anonymous_session_id,
			(arg0 as Context)?.anon_session_is_new,
			(arg0 as Context)?.anonymous_user_id
		);
		this.original_context = arg0 instanceof App ? null : arg0;
	}
}
