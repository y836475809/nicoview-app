const cheerio = require("cheerio");
const { NicoClientRequest } = require("./nico-client-request");
const { NICO_URL, getWatchURL } = require("./nico-url");
const { logger } = require("./logger");

class NicoAPI {
    isDmc(){
        return this._api_data != null && this._api_data != undefined;
    }

    getVideo(){
        return this._video;
    }

    isDeletedVideo(){
        return this._video.isDeleted;
    }

    getVideoQuality(){
        return this._video_quality;
    }

    getTags(){
        return this._tags;
    }

    getOwner(){
        return this._owner;
    }

    getCommentOwnerThread(){
        return this._comment.threads[0];
    }
    getCommentDefaultThread(){
        return this._comment.threads[1];
    }

    getSession(){
        return this._session;
    }

    parse(api_data){
        this._api_data = api_data;
        const video = this._api_data.video;
        const count = this._api_data.video.count;
        const movie = this._api_data.media.delivery.movie;
        this._video = {
            id: video.id,
            title: video.title,
            duration: video.duration,
            description: video.description,
            isDeleted: video.isDeleted,
            registeredAt: video.registeredAt,

            // TODO とりあえずmp4にしておく
            videoType: "mp4", 

            count:{
                view: count.view,
                comment: count.comment,
                mylist: count.mylist,
                like: count.like,
            },
            thumbnail: {
                url: video.thumbnail.url, 
                largeUrl: video.thumbnail.largeUrl,
            }
        };

        this._video_quality = {
            audios: movie.audios,
            videos: movie.videos,
        };

        const owner = this._api_data.owner;
        this._owner = {
            id: owner?owner.id:"", 
            nickname: owner?owner.nickname:"", 
            iconUrl: owner?owner.iconUrl:"", 
        };

        const threads = this._api_data.comment.threads;
        this._comment = {
            threads:threads
        };

        const tags = this._api_data.tag.items;
        this._tags = tags.map(item => {
            return {
                name: item.name,
                isLocked: item.isLocked,
                isCategory: item.isCategory
            };
        });

        const session = this._api_data.media.delivery.movie.session;
        this._session = {
            recipeId: session.recipeId,
            contentId: session.contentId,
            videos:session.videos,
            audios:session.audios,
            heartbeatLifetime:session.heartbeatLifetime,
            token: session.token,
            signature: session.signature,
            contentKeyTimeout: session.contentKeyTimeout,
            serviceUserId: session.serviceUserId,
            playerId: session.playerId,
            url: session.urls[0].url,
            priority: session.priority,
        };
    }

    validate(){
        if(this._typeOf(this._api_data)!="object"){
            return false;
        }

        if(this._typeOf(this._session)!="object"){
            return false;
        }

        if(this._typeOf(this._video)!="object"){
            return false;
        } 

        if(this._typeOf(this._comment)!="object"){
            return false;
        }   
        
        if(this._typeOf(this._owner)!="object"){
            return false;
        }   
        return true;
    }

    _typeOf(obj) {
        const toString = Object.prototype.toString;
        return toString.call(obj).slice(8, -1).toLowerCase();
    }
}

class NicoWatch {
    constructor() { 
        this._req = null;
    }

    cancel(){   
        if (this._req) {
            this._req.cancel();
        }
    }

    async watch(video_id){
        const url = getWatchURL(video_id);
        this._req = new NicoClientRequest();
        const body = await this._req.get(url);
        const $ = cheerio.load(body);
        const data_json = $("#js-initial-watch-data").attr("data-api-data");
        if(!data_json){
            throw new Error("not find data-api-data");
        }
        const api_data = JSON.parse(data_json);
        const nico_api = new NicoAPI();
        nico_api.parse(api_data);

        const nico_cookie = this._req.getNicoCookie();
        return { nico_cookie, nico_api }; 
    }
}

class NicoVideo {
    constructor(nico_api, heart_beat_rate=0.9) {
        this._nico_api = nico_api;  

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
        return this._nico_api.isDmc();
    }

    get DmcSession() {
        if (!this.isDmc()) {
            return null;
        }

        const session_api = this._nico_api.getSession();
        return {
            session: {
                recipe_id: session_api.recipeId,
                content_id: session_api.contentId,
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
                        lifetime: session_api.heartbeatLifetime
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
                    content_key_timeout: session_api.contentKeyTimeout,
                    service_id: "nicovideo",
                    service_user_id: session_api.serviceUserId
                },
                client_info: {
                    player_id: session_api.playerId
                },
                priority: session_api.priority
            }
        };
    }

    async postDmcSession() {
        if (!this.DmcSession) {
            throw new Error(`dmc info is ${this.DmcSession}`);
        }  

        const session_url = this._nico_api.getSession().url;
        const url = `${session_url}?_format=json`;
        const json = this.DmcSession;

        this._req_session = new NicoClientRequest();
        const body = await this._req_session.post(url, {json:json});
        this.dmc_session = body.data;
    }

    get DmcContentUri() {
        return this.dmc_session.session.content_uri;
    }

    optionsHeartBeat() {
        this.stopHeartBeat();

        const id = this.dmc_session.session.id;
        const session_url = this._nico_api.getSession().url;
        const url = `${session_url}/${id}?_format=json&_method=PUT`;
        
        this._req_hb_options = new NicoClientRequest();
        return this._req_hb_options.options(url);
    }
    
    postHeartBeat(on_error) {
        this.stopHeartBeat();

        const id = this.dmc_session.session.id;
        const session_url = this._nico_api.getSession().url;
        const url = `${session_url}/${id}?_format=json&_method=PUT`;
        const session = this.dmc_session;
        const interval_ms = this._nico_api.getSession().heartbeatLifetime * this._heart_beat_rate;
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
    
    isSmileMaxQuality(){
        const url = this._api_data.video.smileInfo.url;
        return !/low/.test(url);
    }

    isDMCMaxQuality(){
        const { audios, videos } = this._nico_api.getVideoQuality();
        const max_quality = { 
            video: videos[0].id,
            audio: audios[0].id
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
    constructor(nico_api) {
        this._nico_api = nico_api;
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
        return this._req.post(`${NICO_URL.MSG}/api.json/`, {json:post_data});
    }

    hasOwnerComment() {
        const thread = this._nico_api.getCommentOwnerThread();
        return thread.isActive;
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
        const thread = this._nico_api.getCommentDefaultThread();
        const id = thread.id;
        const fork = thread.fork;

        const duration = this._nico_api.getVideo().duration;
        const content_len = this._getContentLen(duration);

        let cmds = [];
        cmds.push(this._getPing("rs", r_no));
        this._addCommand(cmds, p_no, {
            thread: {
                thread: id,
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
                thread: id,
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
        const owner_thread = this._nico_api.getCommentOwnerThread();
        const default_thread = this._nico_api.getCommentDefaultThread();
        const thread0 = owner_thread.id;
        const fork0 = owner_thread.fork;
        const thread1 = default_thread.id;
        const fork1 = default_thread.fork;

        const duration = this._nico_api.getVideo().duration;
        const content_len = this._getContentLen(duration);

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
        const default_thread = this._nico_api.getCommentDefaultThread();
        const thread1 = default_thread.id;
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
    NicoAPI,
    NicoWatch,
    NicoVideo,
    NicoComment,
    NicoThumbnail,
};