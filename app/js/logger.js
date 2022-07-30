const log = require("electron-log");

class Logger {
    constructor(){
        log.transports.file.fileName = "app.log";

        log.transports.console.level = "info";
        log.transports.file.level = "info";
        if (process.env.LOG_LEVEL == "debug") {
            log.transports.console.level = "debug";
            log.transports.file.level = "debug";
        }
    }

    /**
     * 
     * @param {string} level 
     */
    setLevel(level){
        if(level=="debug"){
            log.transports.console.level = "debug";
            log.transports.file.level = "debug";
        }else{
            log.transports.console.level = "info";
            log.transports.file.level = "info";
        }
    }

    /**
     * 
     * @returns {string}
     */
    getPath(){
        return log.transports.file.getFile().path;
    }

    info(...params){
        log.info(...params);
    }

    warn(...params){
        log.warn(...params);
    }

    error(...params){
        log.error(...params);
    }

    debug(...params){
        log.debug(...params);
    }
}

const logger = new Logger();
module.exports = { 
    logger
};