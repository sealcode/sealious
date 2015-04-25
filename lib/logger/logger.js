var winston = require('winston');
var ConfigManager = require("../config/config-manager.js");

ConfigManager.set_default_config({
    "logger_level" : "info"
    // todo: default folder path
})

var myCustomLevels = {
    levels: {
        lazyseal: 0,
        info: 1,
        debug: 2,
        warning: 3,
        error: 4
    },
    colors: {
        lazyseal: "#637C84",
        debug: '#FED93C',
        warning: '#FF772E',
        error: 'red'
    }
};


var logger = new (winston.Logger)(
    { 
        levels: myCustomLevels.levels, 
        colors: myCustomLevels.colors,
        transports: [
            new (winston.transports.Console)({ level: ConfigManager.get_config.logger_level })
        ]
    }
);

logger.lazyseal("lol");
logger.info("lol2")




/*

var logger = new (winston.Logger)({
    transports: [
    new (winston.transports.Console)({ level: 'debug' }),
    new (winston.transports.File)({ filename: 'somefile.log' })
    ]
});

logger.log('silly', "127.0.0.1 - there's no place like home");
logger.log('debug', "127.0.0.1 - there's no place like home");
logger.log('verbose', "127.0.0.1 - there's no place like home");
logger.log('info', "127.0.0.1 - there's no place like home");
logger.log('warn', "127.0.0.1 - there's no place like home");
logger.log('error', "127.0.0.1 - there's no place like home");
logger.info("127.0.0.1 - there's no place like home");
logger.warn("127.0.0.1 - there's no place like home");
logger.error("127.0.0.1 - there's no place like home");

*/