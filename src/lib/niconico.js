const cheerio = require("cheerio");
const { NicoClientRequest } = require("./nico-client-request");
const { getWatchURL } = require("./nico-url");
const { convToLegacyComments } = require("./nico-data-converter");
const { logger } = require("./logger");
const { getQuality } = require("./nico-hls-request");
const NicoAuth = require("./nico-auth");

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

    isMaxQuality(){
        return this._is_max_quality;
    }

    getDomand(){
        return this._domand;
    }

    getwatchTrackId(){
        return this._watch_track_id;
    }

    getTags(){
        return this._tags;
    }

    getOwner(){
        return this._owner;
    }

    getNvComment(){
        return this._nvComment;
    }

    getCommentOwnerThread(){
        if(this._owner_threads.length==0){
            return null;
        }
        return this._owner_threads[0];
    }

    getCommentUserThreads(){
        return this._user_threads;
    }

    parse(api_data){
        this._api_data = api_data;
        const video = this._api_data.video;
        const count = this._api_data.video.count;

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

        const owner = this._api_data.owner;
        this._owner = {
            id: owner?owner.id:"", 
            nickname: owner?owner.nickname:"", 
            iconUrl: owner?owner.iconUrl:"", 
        };

        const threads = this._api_data.comment.threads;
        this._owner_threads = threads.filter(thread => thread.isActive && thread.isOwnerThread);
        this._user_threads = threads.filter(thread => thread.isActive && !thread.isOwnerThread);
        this._nvComment = this._api_data.comment.nvComment;

        const tags = this._api_data.tag.items;
        this._tags = tags.map(item => {
            return {
                name: item.name,
                isLocked: item.isLocked,
                isCategory: item.isCategory
            };
        });

        this._domand = this._api_data.media.domand;
        this._watch_track_id = this._api_data.client.watchTrackId;
        this._is_max_quality = getQuality(this._domand).is_max_quality;
    }

    validate(){
        if(this._typeOf(this._api_data)!="object"){
            return false;
        }

        if(this._typeOf(this._video)!="object"){
            return false;
        } 

        if(this._typeOf(this._owner_threads)!="array"){
            return false;
        }

        if(this._typeOf(this._user_threads)!="array"){
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
        const cookie = await NicoAuth.get_cookie();
        const body = await this._req.get(url, {cookie: cookie});
        const $ = cheerio.load(body);
        // const data_json = $("#js-initial-watch-data").attr("data-api-data");
        // if(!data_json){
        //     throw new Error("not find data-api-data");
        // }
        // const api_data = JSON.parse(data_json);
        const content = $("head > meta[name='server-response']").attr("content");
        if(!content){
            throw new Error("not find api-data");
        }
        const json_data = JSON.parse(content);
        const api_data = json_data.data.response;
        const nico_api = new NicoAPI();
        nico_api.parse(api_data);

        return { nico_api }; 
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
}

class NicoComment {
    /**
     * 
     * @param {NicoAPI} nico_api 
     */
    constructor(nico_api) {
        /** @type {NicoAPI} */
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

    async getComment() {
        const nv_commnets = await this._post();
        const chats = convToLegacyComments(nv_commnets);
        return chats;
    }

    async getCommentDiff(res_from) {
        throw Error("not implement getCommentDiff");
        // const josn = this._get_comment_diff_json(res_from);
        // return await this._post(josn);
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

    async _post(){
        const nvComment = this._nico_api.getNvComment();
        const post_data = {
            "params": nvComment["params"],
            "additionals": {},
            "threadKey": nvComment["threadKey"]
        };
        const url = `${nvComment["server"]}/v1/threads`;
        this._req = new NicoClientRequest();
        return await this._req.post(url, {json:post_data});
    }

    hasOwnerComment() {
        const thread = this._nico_api.getCommentOwnerThread();
        if(!thread){
            return false;
        }
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

    _createThreadObj(id, fork, is_owner, is_force_184, threadkey){
        let obj =  {
            thread: String(id),
            version: is_owner?"20061206":"20090904",
            fork: fork,
            language: 0,
            user_id: "",
            with_global: 1,
            scores: 1,
            nicoru: 3,
            force_184: "1"
        };
        if(is_force_184){
            obj.force_184 = "1";
        }
        if(threadkey){
            obj.threadkey = threadkey;
        }
        return obj;
    }

    _createThreadLeavesObj(id, fork, content_len, is_force_184, threadkey){
        let obj = {
            thread: String(id),
            fork: fork,
            language: 0,
            user_id: "",
            content: `0-${content_len}:100,1000,nicoru:100`,
            scores: 1,
            nicoru: 3,
            force_184: "1"
        };
        if(is_force_184){
            obj.force_184 = "1";
        }
        if(threadkey){
            obj.threadkey = threadkey;
        }
        return obj;
    }

    _createDiffThreadObj(id, res_from, threadkey){
        let obj = {
            thread: String(id),
            version: "20061206",
            language: 0,
            user_id: "",
            res_from: res_from,
            with_global: 1,
            scores: 0,
            nicoru: 3
        };
        if(threadkey){
            obj.threadkey = threadkey;
        }
        return obj;
    }

    makeJsonNoOwner(r_no, p_no) {
        //no owner
        const duration = this._nico_api.getVideo().duration;
        const content_len = this._getContentLen(duration);

        let cmds = [];
        cmds.push(this._getPing("rs", r_no));

        let p_no_cnt = p_no;
        const user_threads = this._nico_api.getCommentUserThreads();
        user_threads.forEach(user_thread => {
            const id = user_thread.id;
            const fork = user_thread.fork;
            const forced = user_thread.is184Forced;
            const threadkey = user_thread.threadkey;
        
            this._addCommand(cmds, p_no_cnt, {
                thread: this._createThreadObj(id, fork, false, forced, threadkey)
            });
            p_no_cnt++;

            if(user_thread.isLeafRequired){
                this._addCommand(cmds, p_no_cnt, {
                    thread_leaves: this._createThreadLeavesObj(id, fork, content_len, forced, threadkey)
                });
                p_no_cnt++;
            }
        });
        
        cmds.push(this._getPing("rf", r_no));
        
        return cmds;
    }

    makeJsonOwner(r_no, p_no) {
        //owner
        const owner_thread = this._nico_api.getCommentOwnerThread();
        const owner_id = owner_thread.id;
        const owner_fork = owner_thread.fork;
        const owner_forced = owner_thread.is184Forced;
        const owner_threadkey = owner_thread.threadkey;

        const duration = this._nico_api.getVideo().duration;
        const content_len = this._getContentLen(duration);

        let cmds = [];
        cmds.push(this._getPing("rs", r_no));

        let p_no_cnt = p_no;
        this._addCommand(cmds, p_no_cnt, {
            thread: this._createThreadObj(owner_id, owner_fork, true, owner_forced, owner_threadkey)
        });
        p_no_cnt++;

        if(owner_thread.isLeafRequired){
            this._addCommand(cmds, p_no_cnt, {
                thread_leaves: this._createThreadLeavesObj(owner_id, owner_fork, content_len, owner_forced, owner_threadkey)
            });
            p_no_cnt++;
        }

        const user_threads = this._nico_api.getCommentUserThreads();
        user_threads.forEach(user_thread => {
            const id = user_thread.id;
            const fork = user_thread.fork;
            const forced = user_thread.is184Forced;
            const threadkey = user_thread.threadkey;

            this._addCommand(cmds, p_no_cnt, {
                thread: this._createThreadObj(id, fork, false, forced, threadkey)
            });
            p_no_cnt++;

            if(user_thread.isLeafRequired){
                this._addCommand(cmds, p_no_cnt, {
                    thread_leaves: this._createThreadLeavesObj(id, fork, content_len, forced, threadkey)
                });
                p_no_cnt++;
            }     
        });  
        
        cmds.push(this._getPing("rf", r_no));
        return cmds;
    }

    makeJsonDiff(r_no, p_no, res_from) {
        const user_threads = this._nico_api.getCommentUserThreads();
        const user_thread = user_threads[0];
        const id = user_thread.id;
        const threadkey = user_thread.threadkey;

        let cmds = [];
        cmds.push(this._getPing("rs", r_no));

        this._addCommand(cmds, p_no, {
            thread: this._createDiffThreadObj(id, res_from, threadkey)
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