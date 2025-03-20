import { translations as pl } from "./pl.js";
import { translations as en } from "./en.js";

const languages: {
	[lang: string]: { [key: string]: (...args: unknown[]) => string };
} = {
	pl,
	en,
};

export default languages;
