import { ActionName } from "../action";

const method_map: { [method: string]: ActionName } = {
	GET: "show",
	POST: "create",
	PATCH: "edit",
	PUT: "replace",
	DELETE: "delete",
};

export default method_map;
