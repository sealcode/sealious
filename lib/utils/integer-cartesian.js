"use strict";
const clone = require("clone");

const IntegerCartesian = {
	// integer-only
	next: function(sources, element){
		const new_element = clone(element);
		if(element === null){
			return sources.map(()=>0);
		}else{
			let i = element.length-1;
			while(i>=0){
				if(element[i] >= sources[i]){
					throw new Error(`Invalid element. Max value on index '${  i.toString()  }' is '${  (sources[i]-1).toString()  }'`);
				}
				if(element[i] === sources[i] -1){
					new_element[i] = 0;
				}else{
					break;
				}
				i--;
			}
			if(i === -1){
				return null;
			}
			new_element[i] = new_element[i]+1;
			return new_element;
		}
	},
};

module.exports = IntegerCartesian;

/*
//simple tests
console.log(Cartesian.next([3, 2], null)); // [0,0]
console.log(Cartesian.next([3, 2], [0,0]));
console.log(Cartesian.next([3, 2], [0,1]));
console.log(Cartesian.next([3, 2], [1,0]));
console.log(Cartesian.next([3, 2], [1,1]));
console.log(Cartesian.next([3, 2], [2,0]));
console.log(Cartesian.next([3, 2], [2, 1])); //null
*/
