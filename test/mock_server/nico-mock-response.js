const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const comment_data = require("./data/comment.json");
const data_api_data = require("./data/api-data.json");
const dmc_session_data = require("./data/dmc-session.json");

/* eslint-disable no-console */

const createApiData = (video_id) =>{
    const id = video_id.replace("sm", "");
    const cp_data = JSON.parse(JSON.stringify(data_api_data));
    const video = cp_data.video;
    video.id = video_id;
    video.thumbnail.url      = `https://nicovideo.cdn.nimg.jp/thumbnails/${id}/${id}`;
    video.thumbnail.largeUrl = `https://nicovideo.cdn.nimg.jp/thumbnails/${id}/${id}.L`;
    video.registeredAt = "2018/01/01 01:00:00";

    cp_data.media.delivery.movie.session.recipeId = `nicovideo-${video_id}`;
    // HBの確認しやすいように2秒毎にHB
    cp_data.media.delivery.movie.session.heartbeatLifetime = 2200;

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

const getCommnet = (post_data, comments) => {
    const res_from = post_data[2].thread.res_from;
    if(res_from < 0){
        return comments;
    }
    return [
        {ping: {content: "rs:0"}},
        {ping: {content: "ps:0"}},
        {
            "thread": {
                resultcode: 0,
                thread: "1",
                server_time: 1,
                last_res: res_from+1,
                ticket: "0x00000",
                revision: 1
            }
        },
        { 
            chat:
            { 
                thread: "1",
                no: res_from,
                vpos: 10,
                date: 1555754900,
                date_usec: 388400,
                anonymity: 1,
                user_id: "a",
                mail: "184",
                content: `! no ${res_from}`
            } 
        },
        { 
            chat:
            { 
                thread: "1",
                no: res_from+1,
                vpos: 20,
                date: 1555754900,
                date_usec: 388400,
                anonymity: 1,
                user_id: "b",
                mail: "184",
                content: `! no ${res_from+1}`
            }
        },
        {global_num_res: {thread: "1",num_res: res_from+1}},
        {ping: {content: "pf:0"}},
        {ping: {content: "rf:0"}}
    ];
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

const createSession = (video_id, is_low_quality) =>{
    const id = video_id.replace("sm", "");
    const cp_data = JSON.parse(JSON.stringify(dmc_session_data));
    cp_data.session.id = id;
    cp_data.session.recipe_id = `nicovideo-${video_id}`;
    cp_data.session.content_uri = `https://pa0000.dmc.nico/hlsvod/ht2_nicovideo/nicovideo-${video_id}`;
    if(is_low_quality===true){
        cp_data.session.content_src_id_sets[0].content_src_ids[0].src_id_to_mux.video_src_ids[0] 
            = "archive_h264_600kbps_360p";
    }
    return cp_data;
};

let search_html_count = 0;
class NicoMockResponse {
    searchHtml(req, res, search_target){
        search_html_count++;

        const f_pth = path.join(__dirname, "data", "html", `${search_target}.html`);
        const body = fs.readFileSync(f_pth, "utf-8");

        const cookies = [];
        cookies.push(`nico_gc=${search_html_count}__srch_s%3Df%26srch_o%3Dd; expires=Sun, 14-Nov-2021 00:00:00 GMT; Max-Age=2592000; path=/; domain=.nicovideo.jp`);
        if(!req.headers["cookie"]){
            cookies.push("nicosid=12345.67890; expires=Mon, 13-Oct-2031 10:10:10 GMT; Max-Age=315360000; path=/; domain=.nicovideo.jp");
        }

        this._writeString(req, res, body, "text", 200, cookies);
    }

    search(req, res){
        const sp = new URL(req.url).searchParams;
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

    mylist(req, res){
        const id = new URL(req.url).pathname.replace("/mylist/", "");
        const file_path = path.join(__dirname, "data", `mylist${id}.xml`);
        try {
            fs.statSync(file_path);
            const xml = fs.readFileSync(file_path, "utf-8");
            this._writeString(req, res, xml, "xml");
        } catch (error) {
            this._writeString(req, res, `local server mylist id=${id} : 404 Not Found\n`, "text", 404);
        }
    }

    watch(req, res){
        const video_id = req.url.split("/").pop();
        const apt_data = createApiData(video_id);
        const data_api_data = escapeHtml(JSON.stringify(apt_data));
        const body =  `<!DOCTYPE html>
        <html lang="ja">
            <body>
            <div id="js-initial-watch-data" data-api-data="${data_api_data}"
            </body>
        </html>`;
        this._writeString(req, res, body, "text");
    }

    comment(req, res, body){
        const data = JSON.parse(body);
        if(data.length===0){
            this._writeString(`local server : 404 Not Found\n`, "text", 404);
        }else if(data.length===5){
            this._writeJson(req, res, getCommnet(data, comment_data));
        }else{
            this._writeJson(req, res, comment_data);
        }
    }

    dmcSession(req, res, body){
        const data = JSON.parse(body);
        const recipe_id = data.session.recipe_id;
        const video_id = `sm${recipe_id.match(/\d+/)[0]}`;
        const lowq = false; 
        const dmc_session = createSession(video_id, lowq);
        this._writeJson(req, res, {
            meta: { status: 201, message: "created" },
            data: dmc_session
        });
    }
    
    dmcHB(req, res){
        this._writeJson(req, res, { status: 200, message: "ok" });
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

    downloadVideo(req, res){
        const isgzip = this._isgzip(req, res);
        const { head, video_fs } = this._video("download", isgzip);
        this.download_video_fs = video_fs;

        if(isgzip){ 
            res.writeHead(200, head);
            this.download_video_fs.pipe(zlib.createGzip(req, res)).pipe(res);
        }else{
            res.writeHead(200, head);
            this.download_video_fs.pipe(res);
        }
    }

    playVideo(req, res){
        const isgzip = this._isgzip(req, res);
        const { head, video_fs } = this._video("play", isgzip);
        this.play_video_fs = video_fs;

        if(isgzip){ 
            res.writeHead(200, head);
            this.play_video_fs.pipe(zlib.createGzip()).pipe(res);
        }else{
            res.writeHead(200, head);
            this.play_video_fs.pipe(res);
        }
    }

    close(){
        if(this.download_video_fs){
            this.download_video_fs.destroy();
        }
        if(this.play_video_fs){
            this.play_video_fs.destroy();
        }
    }

    _video(name, isgzip){
        const file_path = path.join(__dirname, "data", `${name}.mp4`);


        let file_size = 0;
        if(isgzip){
            const content = fs.readFileSync(file_path);
            const binary = zlib.gzipSync(content);
            file_size = binary.length;

        }else{
            const stat = fs.statSync(file_path);
            file_size = stat.size;
        }

        const head = {
            'Accept-Ranges': 'bytes',
            'Content-Range': 'bytes ' + 0 + '-' + file_size + '/' + file_size,
            'Content-Length': file_size,
            'Content-Type': 'video/mp4',
        };
        if(isgzip){
            head["Content-Encoding"] = "gzip";
        }
        
        const download_speed = 20;
        const b_szie = 1638000/download_speed;
        const sbuf = Math.floor(file_size/b_szie);
        const video_fs = fs.createReadStream(file_path,  { highWaterMark: sbuf });

        return { head, video_fs };
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
        }else
        {   
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
    NicoMockResponse,
};