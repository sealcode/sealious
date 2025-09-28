export function interpolate(strings: TemplateStringsArray, values: string[]) {
	return strings.reduce((result, str, i) => {
		return result + str + (i < values.length ? values[i] : "");
	}, "");
}
