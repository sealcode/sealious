var Sealious = require("sealious");

var has_bar_field;

module.exports = {
	test_init: function(){
		new Sealious.ChipTypes.FieldType({
			name: "encode_to_bar",
			extends: "text",
			encode: function(){
				return "bar"
			}
		})

		has_bar_field = new Sealious.ChipTypes.ResourceType({
			name: "has_bar_field",
			fields: [{name: "bar", type: "encode_to_bar"}]
		})
	},
	test_start: function(){
		describe("ResourceType", function(){
			it("should not run 'encode' for missing/undefined field values", function(done){
				has_bar_field.encode_field_values(new Sealious.Context(), {bar: undefined})
				.then(function(encoded_body){
					if(encoded_body.bar=="bar"){
						done(new Error());
					}else{
						done();
					}
				})
			})
		})
	}
}