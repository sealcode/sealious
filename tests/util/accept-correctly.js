function acceptCorrectly(done) {
    return {
        accept: done,
        reject: (msg) => done(new Error(msg))
    };
}

module.exports = acceptCorrectly;
