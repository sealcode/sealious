import Context from "./context";
import { App } from "./main";

export default class SuperContext extends Context {
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
