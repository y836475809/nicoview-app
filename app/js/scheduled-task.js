
class sk {
    constructor(hour){
        this.hour = hour;
        this.timer = null;
    }

    start(){
        const rest = this._getRestMinutes()+1;
        this.timer = setTimeout(this.task, 1000*60*rest);
    }

    task(){
        if(this.timer){
            const d = new Date();
            const h = d.getHours();
            const m = d.getMinutes();
            if(h==this.hour && m > 0){

            }
            this.timer = setTimeout(this.task, 1000*60);
        }
    }

    stop(){        
        if(this.timer){
            clearTimeout(this.timer);
            this.timer = null;  
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