
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

        const rest = this._getRestMsec();
        this.timer = setTimeout(()=>{this._task();}, rest);
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

            this.execution().then(()=>{
                const rest = this._getRestMsec();
                this.timer = setTimeout(()=>{this._task();}, rest);
            });
        }
    }

    _getRestMsec(){
        const date = new Date();
        date.setTime(date.getTime() - this._toMsec(0, date.getTimezoneOffset(), 0));

        const sc_msec = this._toMsec(this.scheduled_date.hour, this.scheduled_date.minute, 0);
        const utc_msec = this._toMsec(date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
        const rest = sc_msec - utc_msec;
        if(rest<=0){
            return rest + this._toMsec(24, 0, 0);
        } 
        return rest;
    }

    _toMsec(h, m, s){
        return (h*60*60 + m*60 + s)*1000;
    }
}

module.exports = {
    ScheduledTask
};