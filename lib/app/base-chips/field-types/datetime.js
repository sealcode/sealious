"use strict";

function double_digit(s){
	return (s.toString().length===1? "0" : "") + s;
}

module.exports = {
	name: "datetime",
	extends: "int",
	get_description: function(){
		return "Timestamp - amount of miliseconds since epoch.";
	},
	is_proper_value: function(context, params, datetime){
		if (isNaN(datetime) === true || datetime % 1 !== 0){
			return Promise.reject(`Value '${datetime}' is not datetime format. Only timestamps are accepted.`);
		} else {
			return Promise.resolve();
		}
	},
	encode: function(context, params, value_in_code){
		const parsed_datetime = parseInt(value_in_code);
		return parsed_datetime;
	},
	format: function(context, params, decoded_value, format){
		if(decoded_value === null || decoded_value === undefined){
			return Promise.resolve(decoded_value);
		}
		if(format === undefined){
			return decoded_value;
		}
		else if (format === "human_readable"){
			const date = new Date(decoded_value);
			const year = date.getFullYear();
			const month = double_digit(date.getMonth()+1);
			const day = double_digit(date.getDate());
			const hours = double_digit(date.getHours());
			const minutes = double_digit(date.getMinutes());
			const seconds = double_digit(date.getSeconds());

			const human_readable_date = `${year  }-${  month  }-${  day  } ${  hours  }:${  minutes  }:${  seconds}`;

			return human_readable_date;

		}
		return decoded_value[format] ? decoded_value[format] : decoded_value;
	}
};
