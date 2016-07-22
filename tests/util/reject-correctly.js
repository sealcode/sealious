function rejectCorrectly(done) {
    return {
        accept: () => done(new Error("It accepted!")),
        reject: (msg) => done()
    };
}

module.exports = rejectCorrectly;
