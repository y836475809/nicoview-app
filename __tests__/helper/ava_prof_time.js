

class ProfTime {
    constructor(){
        this.test_times = [];
    }

    clear(){
        this.test_times = [];
    }
    
    start(t){
        t.context.start = new Date();
    }
    end(t){
        const start = t.context.start;
        const ms = new Date().getTime() - start.getTime();
        this.test_times.push({
            name: t.title.replace("afterEach hook for ", ""),
            time: ms
        });
    }

    log(t){
        const black   = "\u001b[30m";
        const red     = "\u001b[31m";
        const green   = "\u001b[32m";
        const yellow  = "\u001b[33m";
        const blue    = "\u001b[34m";
        const magenta = "\u001b[35m";
        const cyan    = "\u001b[36m";
        const white   = "\u001b[37m";
        const reset   = "\u001b[0m";
    
        this.test_times.forEach(value => {
            t.log(`${value.name} ${green}(${value.time} ms)${reset}`);
        });
    }
}

module.exports = {
    ProfTime: ProfTime
};