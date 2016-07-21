module.exports = {
	name: "date",
	get_description: function(){
		return "Date standard ISO 8601 (YYYY-MM-DD)";
	},
	is_proper_value: function(accept, reject, context, params, date){
		const date_in_string = date.toString();

		const regex = /^([0-9]{4})-(0?[1-9]|1[0-2])-([0-2]?[0-9]|30|31)$/; // granulation_per_day

		if (regex.test(date_in_string) === false || isNaN(Date.parse(date_in_string))){
			reject(`Value "${date}" is not date calendar format. Expected value standard IS0 8601 (YYYY-MM-DD)`);
		} else {
			accept();
		}
	}
};
