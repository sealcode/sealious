import App from "../../app/app";
import { LeafSubject } from "../subject";
import * as Errors from "../../response/errors";
import Context from "../../context";
import { ShowActionName } from "../../action";

export default class SingleSpecificationSubject extends LeafSubject {
	collection_name: string;

	constructor(app: App, collection_name: string) {
		super(app);
		this.collection_name = collection_name;
	}
	getName() {
		return "specifications";
	}
	async performAction(_: Context, action_name: ShowActionName, __: any) {
		if (action_name !== "show") {
			throw new Errors.BadSubjectAction(
				`Unknown action for SingleSpecificationsSubject: '${action_name}'`
			);
		}
		return this.app.collections[this.collection_name].getSpecification(
			false
		);
	}
}
