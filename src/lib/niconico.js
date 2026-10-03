const cheerio = require("cheerio");
const { fetchGet, fetchPost } = require("./nico-fetch");
const { getWatchURL } = require("./nico-url");
const { convToLegacyComments } = require("./nico-data-converter");
const { logger } = require("./logger");
const { getQuality } = require("./nico-hls-request");

class NicoAPI {
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
    
    getaccessRightKey(){
        return  this._domand.accessRightKey;
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
        // this._api_data = api_data.$watchV4.data;
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
        /** @type {AbortController?} */
        this._abort = null;
    }

    cancel(){   
        if (this._abort) {
            this._abort.abort();
        }
    }

    async watch(video_id){
        const url = getWatchURL(video_id);
        this.cancel();
        this._abort = new AbortController();
        const res = await fetchGet(url, this._abort);
        const body = await res.text();
        const $ = cheerio.load(body);
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
        /** @type {AbortController?} */
        this._abort = null;
    }

    cancel() {
        if (this._abort) {
            this._abort.abort();
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
        const headers = new Headers([
            ['X-Frontend-Id', '6'],
            ['X-Frontend-Version', '0'],
        ]);
        this.cancel();
        this._abort = new AbortController();
        const res = await fetchPost(url, headers, post_data, this._abort);
        return await res.json();
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
        /** @type {AbortController?} */
        this._abort = null;
    }
    cancel(){
        if (this._abort) {
            this._abort.abort();
        }
    }  
    async getThumbImg(url){
        this.cancel();
        this._abort = new AbortController();   
        const res = await fetchGet(url, this._abort);
        const arrsyBuf = await res.arrayBuffer();
        const buf = Buffer.from(arrsyBuf);
        const uint8Array = new Uint8Array(buf);
        return uint8Array;
    }
}

module.exports = {
    NicoAPI,
    NicoWatch,
    NicoVideo,
    NicoComment,
    NicoThumbnail,
};