import dotProp from "dot-prop";
import merge from "deepmerge";
import Config from "./config";
import Mailer from "../email/mailer";

type ConfigObject = { [key: string]: any };

export default class ConfigManager {
	DEFAULT_CONFIG: ConfigObject;
	CUSTOM_CONFIG: ConfigObject;
	isLocked: boolean;
	constructor() {
		this.DEFAULT_CONFIG = {};
		this.CUSTOM_CONFIG = {};
		this.isLocked = false;
	}
	setDefault(key: string, value: any) {
		this._setGivenConfig(this.DEFAULT_CONFIG, key, value);
	}
	getDefaultConfig(key: string) {
		return dotProp.get(this.DEFAULT_CONFIG, key);
	}
	set(key: string, value: any) {
		this._setGivenConfig(this.CUSTOM_CONFIG, key, value);
	}
	_setGivenConfig(config: ConfigObject, key: string, value: any) {
		this._warnIfLocked();
		dotProp.set(config, key, value);
	}
	_warnIfLocked() {
		if (this.isLocked) {
			console.warn(
				"Warning: " +
					"you shouldn't change config after ConfigManager was locked"
			);
		}
	}
	setRoot(params: ConfigObject) {
		this._warnIfLocked();
		this.CUSTOM_CONFIG = merge(this.CUSTOM_CONFIG, params);
	}
	get<Key extends keyof Config>(key: Key): Config[Key] {
		return dotProp.get(
			merge(this.DEFAULT_CONFIG, this.CUSTOM_CONFIG),
			key
		) as Config[Key];
	}
	lock() {
		this.isLocked = true;
	}
}
