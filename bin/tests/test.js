var should = require("should");

var blanket = require("blanket")({
	"pattern": "node_modules"
});

describe('Array', function(){
	describe('#indexOf()', function(){
		it('should return -1 when the value is not present', function(){
			[1,2,3].indexOf(5).should.equal(-1);
			[1,2,3].indexOf(0).should.equal(-1);
		})
	})
});


var FieldType = require("prometheus-field-type");

describe('FieldType', function(){
	describe('#isProperValue()', function(){
		it('should have a default implementation', function(){
			FieldType.prototype.should.have.property("isProperValue");
		})
		it("should return an always-resolving promise", function(done){
			var type = new FieldType();
			type.isProperValue("anything").then(function(response){
				should(true).be.ok;
				done();
			}).catch(function(err){
				done(err);
			})
		})
	})
});


console.log("i finished all tests");