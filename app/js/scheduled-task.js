
const EventEmitter = require("events");

class ScheduledTask extends EventEmitter{
    constructor(scheduled_hour, execution){
        super();
        this.scheduled_hour = scheduled_hour;
        this.execution = execution;
        this.timer = null;
    }

    start(){
        this.emit("start");

        const rest = this._getRestMinutes()+1;
        this.timer = setTimeout(()=>{this._task();}, 1000*60*rest);
    }

    stop(){        
        if(this.timer){
            clearTimeout(this.timer);
            this.timer = null;  

            this.emit("stop");
        }     
    }

    _task(){
        if(this.timer){
            this.emit("execute");

            this.execution();
            const rest = this._getRestMinutes()+1;
            this.timer = setTimeout(()=>{this._task();}, this._toMsec(rest));
        }
    }

    _getRestMinutes(){
        let date = new Date();
        date = new Date(date.getTime()+this._toMsec(date.getTimezoneOffset()));
        const rest = (this.scheduled_hour-date.getHours())*60 - date.getMinutes();
        if(rest<0){
            return rest + 24*60;
        } 
        return rest;
    }

    _toMsec(minute){
        return minute*60*1000;
    }
}

module.exports = {
    ScheduledTask: ScheduledTask
};