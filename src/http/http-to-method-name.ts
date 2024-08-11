import type { ActionName } from "../action.js";

const method_map: { [method: string]: ActionName } = {
	GET: "show",
	POST: "create",
	PATCH: "edit",
	PUT: "edit",
	DELETE: "delete",
};

export default method_map;
