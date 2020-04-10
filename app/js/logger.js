const log = require("electron-log");

class Logger {
    constructor(){
        log.transports.file.fileName = "app.log";
        log.transports.console.level = "verbose";
        log.transports.file.level = "verbose";
        if (process.env.NODE_ENV == "DEBUG") {
            log.transports.console.level = "silly";
            log.transports.file.level = "silly";
        }
    }

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
module.exports = logger;