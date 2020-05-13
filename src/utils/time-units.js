function time_units(from, to, amount) {
    const formats = {
        'h': 3600000,
        'm': 60000,
        's': 1000,
        'ms': 1
    }

    amount = new Number(amount);
    if (!formats[from] || !formats[to]) {
        throw new Error('Please provide a valid time format');
    }
    if (!amount || typeof amount.valueOf() !== 'number') {
        throw new Error('Please provide a valid amount to convert');
    }

    return (formats[from] / formats[to]).toPrecision(8);

}

module.exports = time_units;
