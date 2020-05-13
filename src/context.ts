import { promisify } from "bluebird-events";
import { EventEmitter } from "events";
import App from "./app/app";

import SuperContext from "./super-context.js";

export default class Context {
	timestamp: number;
	ip: string | null;
	user_id: string | null;
	anonymous_user_id: string | null;
	e: EventEmitter;
	_cached_user_data: boolean;
	loading_user_data: boolean;
	session_id: string | null;
	anonymous_session_id: string | null;
	anon_session_is_new: boolean | null;
	is_super = false;
	constructor(
		timestamp: number = Date.now(),
		ip?: string | null,
		user_id?: string | null,
		session_id?: string | null,
		anonymous_session_id?: string | null,
		anon_session_is_new?: boolean | null,
		anonymous_user_id?: string | null
	) {
		this._cached_user_data = false;
		this.loading_user_data = false;

		this.e = new EventEmitter();
		this.e.setMaxListeners(20);

		Object.defineProperty(this, "session_id", {
			value: session_id,
		}); // to make it non-enumerable and non-writeable

		Object.defineProperty(this, "anonymous_session_id", {
			value: anonymous_session_id || null,
		}); // to make it non-enumerable and non-writeable

		Object.defineProperty(this, "anon_session_is_new", {
			value: anon_session_is_new || false,
		}); // to make it non-enumerable and non-writeable

		this.timestamp = timestamp;
		this.ip = ip || null;
		this.user_id = user_id || null;
		this.anonymous_user_id = anonymous_user_id || null;
		this.session_id = session_id || null;
		this.anonymous_session_id = anonymous_session_id || null;
		this.anon_session_is_new = anon_session_is_new || null;
		this.anonymous_user_id = anonymous_user_id || null;
	}

	get_user_data(app: App) {
		const self = this;

		if (this.user_id === null) {
			return Promise.resolve(null);
		} else if (self.loading_user_data) {
			return promisify(self.e, {
				resolve: "loaded_user_data",
				reject: "error",
			});
		} else if (self._cached_user_data !== false) {
			return Promise.resolve(self._cached_user_data);
		}
		self.loading_user_data = true;
		const c = new SuperContext(self);
		return app
			.run_action(c, ["collections", "users", this.user_id], "show")
			.then(function (user_data) {
				self._cached_user_data = user_data;
				self.loading_user_data = false;
				self.e.emit("loaded_user_data", user_data);
				return user_data;
			})
			.catch(function (error) {
				self.e.emit("error");
				throw error;
			});
	}
}
