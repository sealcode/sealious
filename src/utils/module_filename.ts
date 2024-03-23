import { dirname } from "path";

export function module_dirname(module_url: string): string {
	return dirname(module_url).replace(/^file:\/\//, "");
}
