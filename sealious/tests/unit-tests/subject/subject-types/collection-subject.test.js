"use strict";
const locreq = require("locreq")(__dirname);
const assert = require("assert");
const CollectionSubject = locreq("lib/subject/subject-types/collection-subject.js");

describe("CollectionSubject", function(){
	describe(".name", function(){
		it("should be 'Collection'", function(){
			assert.equal(new CollectionSubject().name, "Collection");
		})
	});
})
