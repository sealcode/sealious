
var shortnames = {};
var names = {};
var descriptions = [];

function clear() {
    shortnames = {};
    names = {};
    descriptions = [];
}

function getValue(text) {
    if (text == null)
        return null;
        
    for (var k = 0; k < text.length; k++)
        if (text[k] < '0' || text[k] > '9')
            return text;
     
    return parseInt(text);
}

function define(shortname, name, defaultValue, text) {
    var description = {
        shortname: shortname,
        name: name,
        default: defaultValue,
        text: text
    };
    
    descriptions.push(description);
    names[name] = description;
    shortnames[shortname] = description;
    
    return this;
}

function process(args) {
    var opts = {};
    
    descriptions.forEach(function(description) {
        if (description.default != null)
            opts[description.name] = description.default;
    });
    
    for (var k = 0; k < args.length; k++)
    {
        var arg = args[k];
        
        if (arg.length > 2 && arg[0] == '-' && arg[1] == '-')
        {
            var name = arg.slice(2);
            var description = names[name];
            k++;
            var val = getValue(args[k]);
            
            if (description)
                opts[description.name] = val;
            else
                opts[name] = val;
        }
        else if (arg.length > 1 && arg[0] == '-')
        {
            var shortname = arg.slice(1);                    
            var description = shortnames[shortname];
            k++;
            var val = getValue(args[k]);
            
            if (description)
                opts[description.name] = val;
            else
                opts[shortname] = val;
        }
        else
        {
            if (!opts._)
                opts._ = [];
                
            opts._.push(getValue(arg));
        }
    }
    
    return opts;
}

process.define = define;
process.clear = clear;

module.exports = process;
