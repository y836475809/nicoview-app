const cheerio = require("cheerio");
const { NicoClientRequest } = require("./nico-client-request");
const { logger } = require("./logger");

const nicovideo_url = "https://www.nicovideo.jp";
const niconmsg_url = "https://nmsg.nicovideo.jp/api.json/";


const getNicoURL = (video_id) => {
    return `${nicovideo_url}/watch/${video_id}`;
};

class NicoWatch {
    constructor() { 
        this._req = null;
    }

    cancel(){   
        if (this._req) {
            this._req.cancel();
        }
    }

    watch(video_id){
        return new Promise(async (resolve, reject) => {
            const url = `${nicovideo_url}/watch/${video_id}`;
            this._req = new NicoClientRequest();
            try {
                const body = await this._req.get(url);
                const $ = cheerio.load(body);
                const data_json = $("#js-initial-watch-data").attr("data-api-data");
                if(!data_json){
                    reject(new Error("not find data-api-data"));
                    return; 
                }
                const api_data = JSON.parse(data_json);
                const nico_cookie = this._req.getNicoCookie();
                resolve({ nico_cookie, api_data }); 
            } catch (error) {
                reject(error);
            }      
        });
    }
}

class NicoVideo {
    constructor(api_data, heart_beat_rate=0.9) {
        this._api_data = api_data;  
        this._dmcInfo = api_data.video.dmcInfo;

        this._heart_beat_rate = heart_beat_rate;
        this._heart_beat_id = null;

        this._req_session = null;
        this._req_hb_options = null;
        this._req_hb_post = null;
    }

    cancel() {
        if (this._req_session) {
            this._req_session.cancel();
        }
        
        if (this._req_hb_options) {
            this._req_hb_options.cancel();
        }

        if (this._req_hb_post) {
            this._req_hb_post.cancel();
        }

        this.stopHeartBeat();
    }

    get SmileUrl() {
        return this._api_data.video.smileInfo.url;
    }

    isDmc() {
        return this._dmcInfo != null;
    }

    get DmcSession() {
        if (!this.isDmc()) {
            return null;
        }
        const session_api = this._dmcInfo.session_api;
        return {
            session: {
                recipe_id: session_api.recipe_id,
                content_id: session_api.content_id,
                content_type: "movie",
                content_src_id_sets: [{
                    content_src_ids: [{
                        src_id_to_mux: {
                            video_src_ids: session_api.videos,
                            audio_src_ids: session_api.audios
                        }
                    }]
                }],
                timing_constraint: "unlimited",
                keep_method: {
                    heartbeat: {
                        lifetime: session_api.heartbeat_lifetime
                    }
                },
                protocol: {
                    name: "http",
                    parameters: {
                        http_parameters: {
                            parameters: {
                                http_output_download_parameters: {
                                    use_well_known_port: "yes",
                                    use_ssl: "yes",
                                    transfer_preset: ""
                                }
                            }
                        }
                    }
                },
                content_uri: "",
                session_operation_auth: {
                    session_operation_auth_by_signature: {
                        token: session_api.token,
                        signature: session_api.signature
                    }
                },
                content_auth: {
                    auth_type: "ht2",
                    content_key_timeout: session_api.content_key_timeout,
                    service_id: "nicovideo",
                    service_user_id: session_api.service_user_id
                },
                client_info: {
                    player_id: session_api.player_id
                },
                priority: session_api.priority
            }
        };
    }

    postDmcSession() {
        return new Promise(async (resolve, reject) => {
            if (!this.DmcSession) {
                const error = new Error(`dmc info is ${this.DmcSession}`);
                reject(error);
            }  

            const url = `${this._dmcInfo.session_api.urls[0].url}?_format=json`;
            const json = this.DmcSession;
            try {
                this._req_session = new NicoClientRequest();
                const body = await this._req_session.post(url, {json:json});
                this.dmc_session = body.data;
                resolve(this.dmc_session);      
            } catch (error) {
                reject(error);
            }
        });
    }

    get DmcContentUri() {
        return this.dmc_session.session.content_uri;
    }

    optionsHeartBeat() {
        this.stopHeartBeat();

        const id = this.dmc_session.session.id;
        const url = `${this._dmcInfo.session_api.urls[0].url}/${id}?_format=json&_method=PUT`;
        
        this._req_hb_options = new NicoClientRequest();
        return this._req_hb_options.options(url);
    }
    
    postHeartBeat(on_error) {
        this.stopHeartBeat();

        const id = this.dmc_session.session.id;
        const url = `${this._dmcInfo.session_api.urls[0].url}/${id}?_format=json&_method=PUT`;
        const session = this.dmc_session;
        const interval_ms = this._dmcInfo.session_api.heartbeat_lifetime * this._heart_beat_rate;   
        
        this._req_hb_post = new NicoClientRequest();
        this.heart_beat_id = setInterval(async () => {              
            try {
                await this._req_hb_post.post(url, {json:session});
            } catch (error) {
                this.stopHeartBeat();
                on_error(error);
            }
            
            logger.debug("nico video HeartBeat");
        }, interval_ms);
    }

    stopHeartBeat() {
        if (this.heart_beat_id) {
            logger.debug("nico video stop HeartBeat");
            clearInterval(this.heart_beat_id);
            this.heart_beat_id = null;
        }
    }

    isMaxQuality(){
        if(this.isDmc()){
            return this._isDMCMaxQuality();
        }else{
            return this._isSmileMaxQuality();
        }
    }
    
    _isSmileMaxQuality(){
        const url = this._api_data.video.smileInfo.url;
        return !/low/.test(url);
    }

    _isDMCMaxQuality(){
        const quality = this._api_data.video.dmcInfo.quality;
        const max_quality = { 
            video: quality.videos[0].id,
            audio: quality.audios[0].id
        };
    
        const src_id_to_mux = 
            this.dmc_session.session.content_src_id_sets[0].content_src_ids[0].src_id_to_mux;
        const session_quality = { 
            video: src_id_to_mux.video_src_ids[0],
            audio: src_id_to_mux.audio_src_ids[0]
        };
    
        return max_quality.video == session_quality.video
            && max_quality.audio == session_quality.audio;
    }
}

class NicoComment {
    constructor(api_data) {
        this._api_data = api_data;
        this._r_no = 0;
        this._p_no = 0;
        this._req = null;
    }

    cancel() {
        if (this._req) {
            this._req.cancel();
        }
    }

    isSuccess(response){
        return response[2].thread.resultcode===0;
    }

    getComment() {
        const josn = this._get_comment_json();
        return this._post(josn);
    }

    getCommentDiff(res_from) {
        const josn = this._get_comment_diff_json(res_from);
        return this._post(josn);
    }

    _get_comment_json(){
        const josn = this.hasOwnerComment() ? 
            this.makeJsonOwner(this._r_no, this._p_no):this.makeJsonNoOwner(this._r_no, this._p_no); 
        this._r_no += 1;
        this._p_no += josn.length;
        return josn;       
    }

    _get_comment_diff_json(res_from){
        const josn = this.makeJsonDiff(this._r_no, this._p_no, res_from);
        this._r_no += 1;
        this._p_no += josn.length;
        return josn;       
    }

    _post(post_data){
        this._req = new NicoClientRequest();
        return this._req.post(niconmsg_url, {json:post_data});
    }

    hasOwnerComment() {
        const comment_composite = this._api_data.commentComposite;
        return comment_composite.threads[0].isActive;
    }

    _getContentLen(duration) {
        return Math.ceil(duration / 60);
    }

    _getPing(name, value){
        return { ping: { content: `${name}:${value}` } };
    }

    _addCommand(cmds, p_no, cmd_obj){
        cmds.push(this._getPing("ps", p_no));
        cmds.push(cmd_obj);
        cmds.push(this._getPing("pf", p_no));
    }

    makeJsonNoOwner(r_no, p_no) {
        //no owner
        const comment_composite = this._api_data.commentComposite;
        const thread = comment_composite.threads[1].id;
        const fork = comment_composite.threads[1].fork;
        const content_len = this._getContentLen(this._api_data.video.duration);

        let cmds = [];
        cmds.push(this._getPing("rs", r_no));
        this._addCommand(cmds, p_no, {
            thread: {
                thread: thread,
                version: "20090904",
                fork: fork,
                language: 0,
                user_id: "",
                with_global: 1,
                scores: 1,
                nicoru: 0
            }
        });
        this._addCommand(cmds, ++p_no, {
            thread_leaves: {
                thread: thread,
                language: 0,
                user_id: "",
                content: `0-${content_len}:100,1000`,
                scores: 1,
                nicoru: 0
            }
        });
        cmds.push(this._getPing("rf", r_no));
        
        return cmds;
    }

    makeJsonOwner(r_no, p_no) {
        //owner
        const comment_composite = this._api_data.commentComposite;
        const thread0 = comment_composite.threads[0].id;
        const fork0 = comment_composite.threads[0].fork;
        const thread1 = comment_composite.threads[1].id;
        const fork1 = comment_composite.threads[1].fork;
        const content_len = this._getContentLen(this._api_data.video.duration);

        let cmds = [];
        cmds.push(this._getPing("rs", r_no));
        this._addCommand(cmds, p_no, {
            thread: {
                thread: thread0,
                version: "20061206",
                fork: fork0,
                language: 0,
                user_id: "",
                res_from: -1000,
                with_global: 1,
                scores: 1,
                nicoru: 0
            }
        });
        this._addCommand(cmds, ++p_no, {
            thread: {
                thread: thread1,
                version: "20090904",
                fork: fork1,
                language: 0,
                user_id: "",
                with_global: 1,
                scores: 1,
                nicoru: 0
            }
        });   
        this._addCommand(cmds, ++p_no, {
            thread_leaves: {
                thread: thread0,
                language: 0,
                user_id: "",
                content: `0-${content_len}:100,1000`,
                scores: 1,
                nicoru: 0
            }
        });         
        cmds.push(this._getPing("rf", r_no));
        return cmds;
    }

    makeJsonDiff(r_no, p_no, res_from) {
        const comment_composite = this._api_data.commentComposite;
        const thread1 = comment_composite.threads[1].id;
        let cmds = [];
        cmds.push(this._getPing("rs", r_no));
        this._addCommand(cmds, p_no, {
            thread: {
                thread: thread1,
                version: "20061206",
                fork: 0,
                language: 0,
                user_id: "",
                res_from: res_from,
                with_global: 1,
                scores: 0,
                nicoru: 0
            }
        });  
        cmds.push(this._getPing("rf", r_no));

        return cmds;
    }
}

class NicoThumbnail {
    constructor() { 
        this._req = null;
    }
    cancel(){
        if (this._req) {
            this._req.cancel();
        }
    }  
    getThumbImg(url){
        this._req = new NicoClientRequest();
        return this._req.get(url, {encoding:"binary"});   
    }
}

module.exports = {
    NicoWatch,
    NicoVideo,
    NicoComment,
    NicoThumbnail,
    getNicoURL
};