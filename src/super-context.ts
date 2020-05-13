import Context from "./context";

export default class SuperContext extends Context {
	is_super = true;
	original_context: Context | null;
	constructor(regular_context?: Context) {
		super(
			regular_context?.timestamp,
			regular_context?.ip,
			regular_context?.user_id,
			regular_context?.session_id,
			regular_context?.anonymous_session_id,
			regular_context?.anon_session_is_new,
			regular_context?.anonymous_user_id
		);

		this.original_context = regular_context || null;

		while ((this.original_context as SuperContext)?.original_context) {
			this.original_context = (this
				.original_context as SuperContext)?.original_context;
		}
	}
}
