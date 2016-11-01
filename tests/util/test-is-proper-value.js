"use strict";
const locreq = require("locreq")(__dirname);
const assert_no_error = locreq("tests/util/assert-no-error.js");
const assert_error = locreq("tests/util/assert-error.js");
const Context = locreq("lib/context.js");


module.exports = function(options){
	const field_type = options.field_type;
	const should_accept = options.should_accept;
	const should_reject = options.should_reject;
	describe(".is_proper_value", function(){
		for(let i in should_accept){
			const _case = should_accept[i];
			it(`accepts ${_case[0]}: ${_case[1]}`, function(done){
				let params;
				if(!_case[2] && _case.length>=3){
					params = _case[2];
				}else{
					params = _case[2] || {};
				}
				const result = field_type.is_proper_value(
					new Context(),
					params,
					_case[1], // new_value
					_case[3] // old_value
				);
				assert_no_error(result, done);
			});
		}

		for(let i in should_reject){
			const _case = should_reject[i];
			it(`rejects ${_case[0]}: ${_case[1]}`, function(done){
				const result = field_type.is_proper_value(
					new Context(),
					_case[2] || {}, // params
					_case[1], // new_value
					_case[3] // old_value
				);
				assert_error(result, done);
			});
		}
	});
}
