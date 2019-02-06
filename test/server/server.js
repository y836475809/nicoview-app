const fs = require("fs");
const http = require("http");
const url = require("url");

const getType = (path) => {
    const types = {
        ".html": "text/html",
        ".css": "text/css",
        ".js": "text/javascript",
        ".png": "image/png",
        ".gif": "image/gif",
        ".svg": "svg+xml"
    };
    for (let key in types) {
        if (path.endsWith(key)) {
            return types[key];
        }
    }
    return "text/plain";
}

http.createServer(function (req, res) {
    const request = url.parse(req.url, true);
    const action = request.pathname;
    const file_path = `./img${action}`;
    const content_type = getType(file_path)
;
    try {
        fs.accessSync(file_path);

        const img = fs.readFileSync(file_path);
        res.writeHead(200, { "Content-Type": content_type });
        res.end(img, "binary");       
    } catch (error) {
        res.writeHead(404, { "Content-Type": content_type });
        res.end("not find \n");
    }
}).listen(8084, "127.0.0.1");