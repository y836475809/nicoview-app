const { exec, spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

class ConvertMP4 {
    constructor(){
        this.pocess = null;
    }

    convert(ffmpeg_path, src_video_file_path){
        const ext = path.extname(src_video_file_path).slice(1);
        const dist_dir_path = path.dirname(src_video_file_path);
        const basename = path.basename(src_video_file_path, ext);
        const dist_video_file_path = path.join(dist_dir_path, `${basename}mp4`);
    
        try {
            fs.statSync(ffmpeg_path);
        } catch (error) {
            throw new Error(`${ffmpeg_path}が見つかりません\n設定ページでffmpegのパスを指定してください`);
        }
        
        // const cmd = `"${ffmpeg_path}" -y -i "${src_video_file_path}" -vcodec libx265 "${dist_video_file_path}"`;
        return new Promise(async (resolve, reject) => {
            this.pocess = spawn(`"${ffmpeg_path}"`, 
                ["-y", "-i", `"${src_video_file_path}"`, "-vcodec", "libx265", `"${dist_video_file_path}"`],
                { shell:true });

            this.pocess.on("error", (error)=>{
                reject(error);
            });
            this.pocess.on("close", (code) => {
                resolve();                
            });
        });
    }

    cancel(){
        if(!this.pocess){
            return;
        }

        return new Promise((resolve, reject) => {
            const cmd = `taskkill /PID ${this.pocess.pid} /T /F`;
            exec(cmd, (error, stdout, stderr) => {
                if(error) {
                    reject(error);
                }else{
                    resolve();
                }
            });
        });
    }
}

module.exports = {
    ConvertMP4,
};