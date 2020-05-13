import { App } from "../main";
import { ChipTypeName } from "../app/chip-manager";

export default class Channel {
	app: App;
	name: string;
	longid: string;
	type_name: ChipTypeName = "channel";
	constructor(app: App, declaration: any) {
		this.name = declaration.name;
		this.longid = `channel.${declaration.name}`;
	}
}
