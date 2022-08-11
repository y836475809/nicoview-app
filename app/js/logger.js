const log = require("electron-log");

class Logger {
    constructor(){
        log.transports.file.fileName = "app.log";
        const log_file_path = process.env["nicoappview_log_file_path"];
        if(log_file_path){
            log.transports.file.resolvePath = () => log_file_path;
        }

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

if(!global._nicoviewapp_logger){
    global._nicoviewapp_logger = new Logger();
}
const logger = global._nicoviewapp_logger;
module.exports = { 
    logger
};