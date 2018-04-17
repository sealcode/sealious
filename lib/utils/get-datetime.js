"use strict";
/*
    Returns the current date and time, default format: "yyyy-mm-dd hh:mm:ss.mmm", ex. "2000-01-01 20:00:00.000"
*/
function getDateTime(with_date) {
	const date = new Date();

	let hour = date.getHours();
	hour = (hour < 10 ? "0" : "") + hour;

	let min = date.getMinutes();
	min = (min < 10 ? "0" : "") + min;

	let sec = date.getSeconds();
	sec = (sec < 10 ? "0" : "") + sec;

	let milli = date.getMilliseconds();
	milli = (milli < 10 ? "00" : "") + milli;
	milli = (milli < 100 && milli >= 10 ? "0" : "") + milli;

	const year = date.getFullYear();

	let month = date.getMonth() + 1;
	month = (month < 10 ? "0" : "") + month;

	let day = date.getDate();
	day = (day < 10 ? "0" : "") + day;

	if (!with_date) {
		return `${hour}:${min}:${sec}.${milli}`;
	} else {
		return `${year}-${month}-${day} ${hour}:${min}:${sec}.${milli}`;
	}
}

module.exports = getDateTime;
