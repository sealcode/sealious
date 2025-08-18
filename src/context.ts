import { is, predicates } from "@sealcode/ts-predicates";
import type { App } from "./app/app.js";
import type { CollectionItem } from "./main.js";

export default class Context {
	timestamp: number;
	ip: string | null;
	user_id: string | null;
	user_data: null | Promise<CollectionItem> = null;
	loading_user_data: boolean;
	session_id: string | null;
	is_super = false;
	original_context: Context | null;
	cache_entries: Record<string, unknown>;

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
		this.cache_entries = {};
	}

	cache<T>(key: string, getter: () => Promise<T>): Promise<T> {
		if (!this.cache_entries[key]) {
			this.cache_entries[key] = getter();
		}
		return this.cache_entries[key] as Promise<T>;
	}

	async getUserData(): Promise<CollectionItem | null> {
		if (this.user_data) {
			return this.user_data;
		}

		if (this.user_id === null) {
			return null;
		}
		const c = new SuperContext(this.app);
		this.user_data = this.app.collections.users.getByID(c, this.user_id);
		return this.user_data;
	}

	async getRoles(): Promise<string[]> {
		const user_data = await this.getUserData();
		if (!user_data) {
			return [];
		}
		const roles = user_data.get("roles");
		if (
			!is(
				roles,
				predicates.array(predicates.shape({ role: predicates.string }))
			)
		) {
			throw new Error(
				`Unexpected error when trying to read roles of the user. Expected {role: string}[], got: ${roles}`
			);
		}
		return (roles as { role: string }[]).map(({ role }) => role);
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

	cache<T>(_key: string, getter: () => Promise<T>): Promise<T> {
		return getter(); // not caching within super context
	}
}
