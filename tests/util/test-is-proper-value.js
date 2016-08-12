"use strict";
const locreq = require("locreq")(__dirname);
const assert_no_error = locreq("tests/util/assert-no-error.js");
const assert_error = locreq("tests/util/assert-error.js");
const Context = locreq("lib/context.js");


module.exports = function(options){
	let field_type = options.field_type;
	let should_accept = options.should_accept;
	let should_reject = options.should_reject;
	describe(".is_proper_value", function(){
		for(let i in should_accept){
			let _case = should_accept[i];
			it(`accepts ${_case[0]}: ${_case[1]}`, function(done){
				let result = field_type.is_proper_value(
					new Context(), 
					_case[2] || {}, 
					_case[1]
				);
				assert_no_error(result, done);
			});
		}
		
		for(let i in should_reject){
			let _case = should_reject[i];
			it(`rejects ${_case[0]}: ${_case[1]}`, function(done){
				let result = field_type.is_proper_value(
					new Context(),
					_case[2] || {},
					_case[1]
				);
				assert_error(result, done);
			});
		}
	});
}
