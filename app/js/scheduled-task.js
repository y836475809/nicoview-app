
const EventEmitter = require("events");

class ScheduledTask extends EventEmitter{
    constructor(date, execution){
        super();
        this.scheduled_date = date;
        this.execution = execution;
        this.timer = null;
    }

    start(){
        this.emit("start");

        const rest = this._getRestMinutes();
        this.timer = setTimeout(()=>{this._task();}, this._toMsec(rest));
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
            const rest = this._getRestMinutes();
            this.timer = setTimeout(()=>{this._task();}, this._toMsec(rest));
        }
    }

    _getRestMinutes(){
        const date = new Date();
        const offset = date.getTimezoneOffset();
        date.setTime(date.getTime() - this._toMsec(offset));

        const minute = this.scheduled_date.houer*60 + this.scheduled_date.minute;
        const rest = minute - (date.getUTCHours()*60 + date.getUTCMinutes());
        if(rest<=0){
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