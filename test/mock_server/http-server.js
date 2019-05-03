const http = require("http");
const fs = require("fs");

http.createServer((req, res) => {
    // console.log(req.url);
    const id = req.url.replace("/smile?i=", "");
    const path = `${__dirname}/data/sm${id}.jpeg`;
    try {
        fs.statSync(path);
        const img = fs.readFileSync(path);
        res.writeHead(200, {"Content-Type": "image/jpeg" });
        res.end(img, "binary");
    } catch (error) {
        res.writeHead(404, {"Content-Type": "text/plain"});
        res.write("404 Not Found\n");
        res.end();
    }

}).listen(8099);