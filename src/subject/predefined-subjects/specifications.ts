import Subject from "../subject";
import Context from "../../context";
import * as Errors from "../../response/errors";
import { ShowActionName } from "../../action";
import SingleSpecificationSubject from "../subject-types/single-specification-subject";

export default class SpecificationsSubject extends Subject {
	async performAction(_: Context, action_name: ShowActionName, __: any) {
		if (action_name === "show") {
			return Object.keys(this.app.collections).map((collection_name) =>
				this.app.collections[collection_name].getSpecification(false)
			);
		}

		throw new Errors.BadSubjectAction(
			`Unknown/unsupported action '${action_name}' for SpecificationsSubject`
		);
	}

	async getChildSubject(path_element: string) {
		const collection_name = path_element;
		return new SingleSpecificationSubject(this.app, collection_name);
	}

	getName() {
		return "specifications";
	}
}
