import prettyMs from "pretty-ms";

const dateFormatters = {
	"yyyy-mm-dd": (date: Date) => date.toISOString().split("T")[0],
};
const timeFormatters = {
	"hh:mm:ss": (parsed_time: string) => parsed_time.substring(0, 8),
	"hh:mm:ss.mmm": (parsed_time: string) => parsed_time.slice(0, -1),
};
const dateFormats = Object.keys(dateFormatters);
const timeFormats = Object.keys(timeFormatters);

export function getTimeOfNow() {
	return getDateTime(new Date(), "hh:mm:ss.mmm");
}

export function getTimeDifference(begin: number, end: number) {
	const date = new Date();
	const currentTime = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()}`;
	const difference = `${prettyMs(end - begin)}`;
	return `${currentTime} (${difference})`;
}

export function getNow() {
	return getDateTime(new Date(), "yyyy-mm-dd hh:mm:ss.mmm");
}

export function getDateTime(date: Date, format_string = "yyyy-mm-dd hh:mm:ss") {
	const formats = format_string.split(" ");
	return formats
		.reduce((date_string, format) => {
			if (dateFormats.includes(format)) {
				return (
					date_string +
					" " +
					dateFormatters[format as keyof typeof dateFormatters](date)
				);
			} else if (timeFormats.includes(format)) {
				const parsed_time = date.toISOString().split("T")[1];
				return (
					date_string +
					" " +
					timeFormatters[format as keyof typeof timeFormatters](
						parsed_time
					)
				);
			} else {
				throw new Error("Unknown format: " + format);
			}
		}, "")
		.trimLeft();
}
