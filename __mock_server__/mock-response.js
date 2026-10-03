const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const nvcomments_data = require("./data/nvcomments.json");
const data_api_data = require("./data/data-api-data.json");

/* eslint-disable no-console */

const createApiData = (video_id) =>{
    const id = video_id.replace("sm", "");
    const cp_data = JSON.parse(JSON.stringify(data_api_data)).data;
    const video = cp_data.video;
    video.id = video_id;
    video.thumbnail.url      = `https://nicovideo.cdn.nimg.jp/thumbnails/${id}/${id}`;
    video.thumbnail.large = `https://nicovideo.cdn.nimg.jp/thumbnails/${id}/${id}.L`;
    video.registeredAt = "2018/01/01 01:00:00";
    return cp_data;
};

const escapeHtml = (str) => {
    str = str.replace(/&/g, "&amp;");
    str = str.replace(/>/g, "&gt;");
    str = str.replace(/</g, "&lt;");
    str = str.replace(/"/g, "&quot;");
    str = str.replace(/'/g, "&#x27;");
    str = str.replace("`", "&#x60;");
    str = str.replace(/\//g, "\\/");
    return str;
};

const base64_map = new Map();
const createImg = (fname) => {
    if(!base64_map.has(fname)){
        const content = fs.readFileSync(path.join(__dirname, "data", fname));
        const base64_data = content.toString( 'base64' );
        base64_map.set(fname, base64_data);
    }
    const base64_data = base64_map.get(fname);
    return Buffer.from(base64_data, "base64");
};


class MockResponse {
    search(url, req, res){
        const sp = new URL(url).searchParams;
        const text = sp.get("q");
        const limit = parseInt(sp.get("_limit"));
        const offset = parseInt(sp.get("_offset"));
        const data = [];
        for (let i = 0; i < limit; i++) {
            const tag_cnt = Math.floor(Math.random() * 5);
            const tags = [];
            for (let index = 0; index < tag_cnt; index++) {
                tags.push(`tag${index+1}`);
            }
            const no = offset + i;
            data.push({
                thumbnailUrl: `https://nicovideo.cdn.nimg.jp/thumbnails/${no}/${no}.1234`,
                contentId: `sm${no}`,
                title: `title ${text} ${no}`,
                tags: tags.join(" "),
                viewCounter: Math.floor(Math.random() * 100),
                commentCounter: Math.floor(Math.random() * 100),
                lengthSeconds: Math.floor(Math.random() * 300),
                startTime: new Date(new Date().getTime() - Math.floor(Math.random() * 5000)).toISOString()
            });
        }
        // 検索語が数値の場合、その数値をヒット数にする
        let count = parseInt(text);
        if(isNaN(count)){
            count = 1000;
        }
        const obj = {
            meta: { 
                status: 200,
                totalCount: count,
                id:"1234567890"
            },
            data: data
        };
        this._writeJson(req, res, obj);
    }

    mylist(url, req, res){
        const id = new URL(url).pathname.replace("/mylist/", "");
        const file_path = path.join(__dirname, "data", `mylist${id}.xml`);
        try {
            fs.statSync(file_path);
            const xml = fs.readFileSync(file_path, "utf-8");
            this._writeString(req, res, xml, "xml");
        } catch (error) {
            this._writeString(req, res, `local server mylist id=${id} : 404 Not Found\n`, "text", 404);
        }
    }

    watch(url, req, res){
        const video_id = url.split("/").pop();
        const apt_data = createApiData(video_id);
        const content = escapeHtml(JSON.stringify(
            {
                meta: { status: 200, code: "HTTP_200" },
                data: { response: apt_data }
            }));
        const body =  `<!DOCTYPE html>
        <html lang="ja">
            <head>
                <meta name="server-response" content="${content}"
            </head>
            <body>
            </body>
        </html>`;
        this._writeString(req, res, body, "text");
    }

    contentUrlCookie(req, res){
        const url1 = "https://delivery.domand.nicovideo.jp/hlsbid/12d/playlists/variants";
        const url2 = "session=9535&Policy=eyJT&Signature=Q4R0f&Key-Pair-Id=K11";
        const str = JSON.stringify({
            meta: { status: 201 },
            data: {
                contentUrl:`${url1}/manifest.m3u8?${url2}` 
            }});
        this._writeString(req, res, str, "json", 200, "niconico=100");
    }

    nvComment(req, res){
        const str = JSON.stringify(nvcomments_data);
        this._writeString(req, res, str, "json", 200);
    }

    m3u8(url, req, res){
        const pathname = new URL(url).pathname.split("/").pop();
        if(pathname.endsWith(".m3u8")){
            const m3u8 = fs.readFileSync(`${__dirname}/data/hls/${pathname}`, "utf-8");
            this._writeString(req, res, m3u8, "text", 200);
        }
        if(pathname.endsWith(".key")){
            const key = fs.readFileSync(`${__dirname}/data/hls/${pathname}`);
            res.writeHead(200);
            res.end(key, "binary");
        }
    }

    hlsMedia(url, req, res){
        const pathname = new URL(url).pathname.split("/").pop();
        const key = fs.readFileSync(`${__dirname}/data/hls/${pathname}`);
        res.writeHead(200);
        res.end(key, "binary");
    }
    
    thumbnail(req, res){
        //thumbnailURL https://nicovideo.cdn.nimg.jp/thumbnails/${id}/${id}`;
        //largeThumbnailURL https://img.cdn.nimg.jp/s/nicovideo/thumbnails/${id}/${id}`;
        const img = createImg("sample.L.jpeg");
        this._writeImage(req, res, img);
    }
    userIcon(req, res){
        const img = createImg("user_icon.jpg");
        this._writeImage(req, res, img);
    }

    _isgzip(req, res){ // eslint-disable-line no-unused-vars
        let accept_encoding = req.headers["accept-encoding"];
        if(!accept_encoding) {
            accept_encoding = '';
        }
        return accept_encoding.match(/\bgzip\b/);
    }

    _writeImage(req, res, body, code=200){
        if(this._isgzip(req, res)){
            res.writeHead(code, {
                "Content-Type": "image/jpeg" , "Content-Encoding": "gzip"
            });
            const result = zlib.gzipSync(body);
            res.write(result, "binary");
            res.end();
        }else{   
            res.writeHead(code, {"Content-Type": "image/jpeg" });
            res.end(body, "binary");
        }
    }

    _writeJson(req, res, obj, code=200){
        this._writeString(req, res, JSON.stringify(obj), "json", code);
    }

    _writeString(req, res, data, type, code=200, cookies=null){
        let content_type = "";
        if(type=="text"){
            content_type = "text/plain";
        }
        if(type=="xml"){
            content_type = "application/xml";
        }
        if(type=="json"){
            content_type = "application/json";
        }

        if(this._isgzip(req, res)){
            const head = {
                "Content-Type": content_type, 
                "Content-Encoding": "gzip"
            };
            if(cookies){
                head["Set-Cookie"] = cookies;
            }
            res.writeHead(code, head);
            const buf = new Buffer.from(data, "utf-8");
            const result = zlib.gzipSync(buf);
            res.write(result);
            res.end();
            console.log("_writeString response is gzip");
        }else{
            const head = {
                "Content-Type": content_type
            };
            if(cookies){
                head["Set-Cookie"] = cookies;
            }
            res.writeHead(code, head);
            res.end(data);
            console.log("_writeString response is text");
        }
    }
}

module.exports = {
    MockResponse,
};