const EventEmitter = require("events");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

class ConvertMP4 extends EventEmitter {
    constructor(){
        super();
        this.pocess = null;

        this._cancel = false;
        this._canceled = false;

        this.isWin = /^win/.test(process.platform);
    }

    get canCencel(){
        return this.isWin;
    }

    convert(ffmpeg_path, src_video_file_path){
        const ext = path.extname(src_video_file_path).slice(1);
        const dist_dir_path = path.dirname(src_video_file_path);
        const basename = path.basename(src_video_file_path, ext);
        const dist_video_file_path = path.join(dist_dir_path, `${basename}mp4`);
    
        try {
            fs.statSync(ffmpeg_path);
        } catch (error) {
            let param = ffmpeg_path;
            if(!param){
                param = "ffmpegのパス";
            }
            throw new Error(`${param}が見つかりません\n設定ページでffmpegのパスを指定してください`);
        }

        this._cancel = false;
        this._canceled = false;
        
        // const cmd = `"${ffmpeg_path}" -y -i "${src_video_file_path}" -vcodec libx265 "${dist_video_file_path}"`;
        return new Promise(async (resolve, reject) => {
            this.pocess = spawn(`"${ffmpeg_path}"`, 
                ["-y", "-i", `"${src_video_file_path}"`, "-vcodec", "h264", `"${dist_video_file_path}"`],
                { shell:true });

            this.pocess.on("error", (error)=>{
                reject(error);
            });

            this.pocess.on("close", async (code) => {
                if(this._cancel===false){
                    resolve();
                    return;
                }

                for (let index = 0; index < 10; index++) {
                    await new Promise(resolve => setTimeout(resolve, 100)); 
                    if(this._canceled===true){
                        break;
                    }
                }  

                const error = new Error("cancel"); 
                error.cancel = true;
                reject(error);         
            });
        });
    }

    cancel(){
        if(!this.pocess){
            return;
        }

        if(this.canCencel===false){
            this.emit("cancel_error", new Error("中断はwinowsのみ有効"));
            return;
        }

        this._cancel = true;
        this._canceled = false;

        const cancel_proc = spawn("taskkill", ["/PID", `${this.pocess.pid}`, "/T", "/F"]);
        
        cancel_proc.on("error", (error)=>{
            this._cancel = false;
            this.emit("cancel_error", error);
        });
        cancel_proc.on("close", async (code) => {
            this._canceled = true;
        });
    }
}

module.exports = {
    ConvertMP4,
};