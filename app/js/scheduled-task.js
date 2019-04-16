
class ScheduledTask {
    constructor(hour, execution){
        this.hour = hour;
        this.execution = execution;
        this.timer = null;
    }

    start(){
        const rest = this._getRestMinutes()+1;
        this.timer = setTimeout(this._task, 1000*60*rest);
    }

    stop(){        
        if(this.timer){
            clearTimeout(this.timer);
            this.timer = null;  
        }     
    }

    _task(){
        if(this.timer){
            this.execution();
            const rest = this._getRestMinutes()+1;
            this.timer = setTimeout(this._task, 1000*60*rest);
        }
    }

    _getRestMinutes(){
        const d = new Date();
        const rest = (this.hour-d.getHours())*60 - d.getMinutes();
        if(rest<0){
            return rest + 24*60;
        } 
        return rest;
    }
}

module.exports = {
    ScheduledTask: ScheduledTask
};