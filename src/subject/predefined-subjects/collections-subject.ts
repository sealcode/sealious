import * as Errors from "../../response/errors";
import { NoActionSubject } from "../subject";

import CollectionSubject from "../subject-types/collection-subject";

export default class CollectionsSubject extends NoActionSubject {
	getName = () => "collections";

	async getChildSubject(path_element: string) {
		if (this.app.collections[path_element] === undefined) {
			throw new Errors.BadSubjectPath(
				`Unknown collection: '${path_element}'.`
			);
		}
		return new CollectionSubject(this.app.collections[path_element]);
	}
}
