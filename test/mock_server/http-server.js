const http = require("http");

class NicoHttpServer {
    create(){ 
        this.srever = http.createServer((req, res) => {
            console.log("http req.url=", req.url);

            const id = req.url.split("/").pop();
            try {
                const img = this._createImg(id);
                res.writeHead(200, {"Content-Type": "image/jpeg" });
                res.end(img, "binary");
            } catch (error) {
                res.writeHead(404, {"Content-Type": "text/plain"});
                res.write(`local server id=${id} : 404 Not Found\n`);
                res.end();
            }
        });
    }

    listen(port){
        this.srever.listen(port);
    }
    
    close(){
        this.srever.close();
    }

    _createImg(text){
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = 320;
        canvas.height = 180;

        ctx.fillStyle = "rgb( 255, 255, 255 )" ;
        ctx.fillRect(0, 0, 320, 180);

        ctx.lineWidth = 5;
        ctx.strokeStyle = 'rgb(0,0,255)';
        ctx.strokeRect(0, 0, 320, 180);

        ctx.font = "48pt Arial bold";
        ctx.fillStyle = "rgba( 0, 0, 0, 0.8 )" ;
        ctx.fillText(text, 10, 100);

        const base64 = canvas.toDataURL("image/jpeg");
        const base64_data = base64.replace(/^data:image\/jpeg;base64,/, "");
        return Buffer.from(base64_data, "base64");
    }
}

module.exports = {
    NicoHttpServer,
};