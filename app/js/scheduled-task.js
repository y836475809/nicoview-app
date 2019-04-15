
class sk {
    constructor(hour){
        this.hour = hour;
        this.timer = true;
    }

    start(){
        this.timer = true;
        setTimeout(this.task, 1000*60);
    }

    task(){
        if(this.timer){
            const d = new Date();
            const h = d.getHours();
            const m = d.getMinutes();
            setTimeout(this.task, 1000*60);
        }
    }

    stop(){
        this.timer = false;
    }
}