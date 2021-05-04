const fs = require("fs");
const path = require("path");
const querystring = require("querystring");

const comment_data = require("./data/comment.json");
const data_api_data = require("./data/api-data.json");
const dmc_session_data = require("./data/dmc-session.json");

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

const createImg = (text) => {
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

class NicoMockResponse {
    searchExt(req, res){
        const cookie = req.headers["cookie"];
        if(!cookie.match(/user_session=user_session/)){
            const obj = {
                message:encodeURI("ログインしてください"),
                status:"fail" 
            };
            this._writeJson(res, obj);
            return;
        }

        // https://ext.nicovideo.jp/api/search/search/word?mode=watch&page=1&sort=f&order=d
        const url_obj = new URL(req.url);
        const q = querystring.parse(url_obj.search);
        const text = decodeURI(url_obj.pathname.split("/").slice(-1)[0]);
        const page = parseInt(q["page"]);
        const sort = q["sort"];
        const order = q["order"];
        const limit = 32;
        const offset = limit*(page - 1);
        const list = [];
        for (let i = 0; i < limit; i++) {
            const tag_cnt = Math.floor(Math.random() * 5);
            const comments = [];
            for (let index = 0; index < tag_cnt; index++) {
                comments.push(`コメント${index+1}`);
            }
            const no = offset + i;
            list.push({
                id: `sm${no}`,
                title: `title ${text} ${no}`,
                first_retrieve: new Date(new Date().getTime() - Math.floor(Math.random() * 5000)).toISOString(),
                view_counter: Math.floor(Math.random() * 100),
                mylist_counter: Math.floor(Math.random() * 100),
                thumbnail_url: `https:\\/\\/nicovideo.cdn.nimg.jp\\/thumbnails\\/${no}\\/${no}.1234`,
                num_res: tag_cnt,
                last_res_body: comments.join(" ") + " ",
                length: `${Math.floor(Math.random() * 100)}:${Math.floor(Math.random() * 100)+10}`,
                title_short: `title short ${text} ${no}`,
                description_short:  `description short ${text} ${no}`,
                thumbnail_style: null,
                is_middle_thumbnail: true
            });
        }
        const obj = {
            ss_id:"1234-5678-90",
            list: list,
            count: 1000,
            has_ng_video_for_adsense_on_listing: true,
            related_tags: ["tag1", "tag2"],
            page: page,
            status: "ok"
        };
        this._writeJson(res, obj);
    }

    search(url, res){
        const q = querystring.parse(new URL(url).search);
        const text = q["?q"];
        const limit = parseInt(q["_limit"]);
        const offset = parseInt(q["_offset"]);
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
        this._writeJson(res, obj);
    }

    mylist(url, res){
        const id = new URL(url).pathname.replace("/mylist/", "");
        const file_path = path.join(__dirname, "data", `mylist${id}.xml`);
        try {
            fs.statSync(file_path);
            const xml = fs.readFileSync(file_path, "utf-8");
            this._writeXML(res, xml);
        } catch (error) {
            this._writeBody(res, 404, `local server mylist id=${id} : 404 Not Found\n`);
        }
    }

    watch(url, res){
        const video_id = url.split("/").pop();
        const headers = {
            "Set-Cookie": [
                `nicohistory=${video_id}%3A123456789; path=/; domain=.nicovideo.jp`,
                "nicosid=123456.789; path=/; domain=.nicovideo.jp"
            ]
        };
        const apt_data = createApiData(video_id);
        const data_api_data = escapeHtml(JSON.stringify(apt_data));
        const body =  `<!DOCTYPE html>
        <html lang="ja">
            <body>
            <div id="js-initial-watch-data" data-api-data="${data_api_data}"
            </body>
        </html>`;
    
        res.writeHead(200, headers);
        res.write(body);
        res.end();
    }

    comment(body, res){
        const data = JSON.parse(body);
        if(data.length===0){
            this._writeBody(res, 404, `local server : 404 Not Found\n`);
        }else if(data.length===5){
            this._writeJson(res, getCommnet(data, comment_data));
        }else{
            this._writeJson(res, comment_data);
        }
    }

    dmcSession(body, res){
        const data = JSON.parse(body);
        const recipe_id = data.session.recipe_id;
        const video_id = `sm${recipe_id.match(/\d+/)[0]}`;
        const lowq = false; 
        const dmc_session = createSession(video_id, lowq);
        this._writeJson(res, {
            meta: { status: 201, message: "created" },
            data: dmc_session
        });
    }
    
    dmcHB(res){
        this._writeJson(res, { status: 200, message: "ok" });
    }
    
    thumbnail(url, res){
        //thumbnailURL https://nicovideo.cdn.nimg.jp/thumbnails/${id}/${id}`;
        //largeThumbnailURL https://img.cdn.nimg.jp/s/nicovideo/thumbnails/${id}/${id}`;
        const id = url.split("/").pop();
        const img = createImg(id);
        res.writeHead(200, {"Content-Type": "image/jpeg" });
        res.end(img, "binary");
    }

    downloadVideo(res){
        const { head, video_fs } = this._video("download");
        this.download_video_fs = video_fs;

        res.writeHead(200, head);
        this.download_video_fs.pipe(res);
    }

    playVideo(res){
        const { head, video_fs } = this._video("play");
        this.play_video_fs = video_fs;

        res.writeHead(200, head);
        this.play_video_fs.pipe(res);
    }

    close(){
        if(this.download_video_fs){
            this.download_video_fs.destroy();
        }
        if(this.play_video_fs){
            this.play_video_fs.destroy();
        }
    }

    _video(name){
        const file_path = path.join(__dirname, "data", `${name}.mp4`);

        const stat = fs.statSync(file_path);
        const fileSize = stat.size;
        const head = {
            'Accept-Ranges': 'bytes',
            'Content-Range': 'bytes ' + 0 + '-' + fileSize + '/' + fileSize,
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
        };
        
        const download_speed = 20;
        const b_szie = 1638000/download_speed;
        const sbuf = Math.floor(stat.size/b_szie);
        const video_fs = fs.createReadStream(file_path,  { highWaterMark: sbuf });

        return { head, video_fs };
    }

    _writeJson(res, obj){
        res.writeHead(200,{"Content-Type":"application/json"});
        res.end(JSON.stringify(obj));  
    }

    _writeXML(res, xml){
        res.writeHead(200,{"Content-Type":"application/xml"});
        res.end(xml);
    }

    _writeBody(res, code, body){
        res.writeHead(code, {"Content-Type": "text/plain"});
        res.write(body);
        res.end();
    }
}

module.exports = {
    NicoMockResponse,
};