const assert = require("assert");
const VirtualFile = require.main.require("lib/data-structures/virtual-file.js");

describe("Sealious.VirtualFile", function() {
    it("returns a VirtualFile object", function() {
        const virtualFile1 = new VirtualFile("a", "b");
        assert.strictEqual(virtualFile1.content, "a");
        assert.strictEqual(virtualFile1.mime, "b");

        const virtualFile2 = new VirtualFile("a");
        assert.strictEqual(virtualFile2.mime, "text/plain");
    });
});
