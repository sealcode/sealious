module.exports = {
	name: "datetime",
	get_description: function(){
		return "Timestamp - amount of miliseconds since epoch.";
	},
	is_proper_value: function(accept, reject, context, params, datetime){
		if (isNaN(datetime) === true || datetime % 1 !== 0){
			reject(`Value '${datetime}' is not datetime format. Only timestamps are accepted.`);
		} else {
			accept();
		}
	},
	encode: function(context, params, value_in_code){
		const parsed_datetime = parseInt(value_in_code);
		return parsed_datetime;
	},
};
