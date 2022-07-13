import type App from "./app/app";
import type { CollectionItem } from "./main";

export default class Context {
	timestamp: number;
	ip: string | null;
	user_id: string | null;
	user_data: null | Promise<CollectionItem> = null;
	loading_user_data: boolean;
	session_id: string | null;
	is_super = false;
	original_context: Context | null;

	constructor(
		public app: App,
		timestamp: number = Date.now(),
		user_id?: string | null,
		session_id?: string | null
	) {
		this.original_context = this;
		this.loading_user_data = false;
		this.timestamp = timestamp;
		this.user_id = user_id || null;
		this.session_id = session_id || null;
	}

	async getUserData(app: App): Promise<CollectionItem | null> {
		if (this.user_data) {
			return this.user_data;
		}

		if (this.user_id === null) {
			return null;
		}
		const c = new SuperContext(this.app);
		this.user_data = app.collections.users.getByID(c, this.user_id);
		return this.user_data;
	}

	toDBEntry() {
		return {
			timestamp: this.timestamp,
			ip: this.ip,
			user_id: this.user_id,
			session_id: this.session_id,
		};
	}
}

export class SuperContext extends Context {
	is_super = true;
}
