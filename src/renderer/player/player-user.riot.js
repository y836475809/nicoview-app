const myapi = require("../../lib/my-api");
const { Command } = require("../../lib/command");
const NicoURL = require("../../lib/nico-url");
const { toTimeSec } = require("../../lib/time-format");
const { window_obs } = require("../../lib/my-observable");
const { logger } = require("../../lib/logger");

/** @type {MyObservable} */ 
const player_obs = window_obs;

/**
 * 
 * @param {HTMLImageElement} img 
 * @returns {string}
 */
const getBase64 = (img) => {
    const canvas = document.createElement("canvas");
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);
    const data = canvas.toDataURL("image/jpeg");
    return data;
};

module.exports = {
    state:{
        user_nickname:"",
        user_description_class:"text",
        user_thumbnail_url:"",
    },
    user_id:"",
    user_icon_url:"",
    user_icon_cache_enable:false,
    current_user_icon_url:"",
    is_saved:false,
    onBeforeMount() {
        player_obs.on("player-user:set-data", args => {
            const { user_id, user_nickname, user_icon_url, description, is_saved } = args;

            this.closePopupDescription();

            this.user_id = user_id;
            this.state.user_nickname = user_nickname;
            this.user_icon_url = user_icon_url;
            this.setDescription(description);

            this.is_saved = is_saved;

            this.update();
        });
    },
    async onMounted() {
        await this.setupUserIconCache();
    },
    getUserNickname() {
        return this.state.user_nickname?this.state.user_nickname:"未取得";
    },
    getUserListLink() {
        return this.user_id?`user/${this.user_id}`:"";
    },
    /**
     * 
     * @param {Event} e 
     * @returns {boolean}
     */
    watchLinkClick(e) {
        e.preventDefault(); 
        e.stopPropagation();

        /** @type {HTMLLinkElement} */
        const elm = e.target;
        const paths = elm.href.split("/");
        const video_id = paths.pop();

        Command.play({
            video_id : video_id,
            time : 0
        }, false);
        return false;
    },
    /**
     * 
     * @param {MouseEvent} e 
     * @returns {Promise<boolean>}
     */
    async watchLinkMouseUp(e) {
        e.preventDefault(); 
        e.stopPropagation();

        /** @type {HTMLLinkElement} */
        const elm = e.target;
        const paths = elm.href.split("/");
        const video_id = paths.pop();
        
        if(e.button === 2){ 
            await myapi.ipc.popupContextMenu("player-watch-link", {
                video_id: video_id,
                url: e.target.href
            });
        }      
        return false;
    },
    /**
     * 
     * @param {Event} e 
     * @returns {boolean}
     */
    mylistLinkClick(e) {
        e.preventDefault(); 
        e.stopPropagation();
        
        /** @type {HTMLLinkElement} */
        const elm = e.target;
        const mylist_id = NicoURL.getMylistID(elm.href);
        myapi.ipc.MyList.load(mylist_id);
        return false;
    },
    /**
     * 
     * @param {MouseEvent} e 
     * @returns {Promise<boolean>}
     */
    async mylistLinkMouseUp(e) {
        e.preventDefault(); 
        e.stopPropagation();

        /** @type {HTMLLinkElement} */
        const elm = e.target;
        const mylist_id = NicoURL.getMylistID(elm.href);
        if(e.button === 2){
            await myapi.ipc.popupContextMenu("player-mylist-link", {
                mylist_id: mylist_id,
                url: e.target.href
            });
        }
        return false;
    },
    /**
     * 
     * @param {MouseEvent} e 
     * @returns {Promise<boolean>}
     */
    async linkMouseUp(e) {
        e.preventDefault(); 
        e.stopPropagation();

        /** @type {HTMLLinkElement} */
        const elm = e.target;
        if(e.button === 2){
            await myapi.ipc.popupContextMenu("player-link", {
                url: elm.href
            });
        }
        return false;
    },
    /**
     * 
     * @param {Event} e 
     */
    poundLink(e) {
        /** @type {HTMLElement} */
        const elm = e.target;
        if(elm.classList.contains("seekTime")){
            const seek_time_sec = toTimeSec(elm.dataset.seektime);
            player_obs.trigger("player-video:seek", seek_time_sec);
        }
    },
    /**
     * 
     * @param {string} description 
     */
    setDescription(description) {
        /** @type {HTMLElement[]} */
        const content_elms = this.$$(".user-description");
        content_elms.forEach(content_elm => {  
            content_elm.scrollTop  = 0;
            content_elm.scrollLeft = 0;

            content_elm.innerHTML = description;

            if(content_elm.childElementCount==0){
                this.state.user_description_class = "text";
            }else{
                this.state.user_description_class = "html";
                const a_tags = content_elm.querySelectorAll("a");
                a_tags.forEach(value=>{
                    const href = value.getAttribute("href");
                    const url_kind = NicoURL.getURLKind(href);
                    if(url_kind=="watch"){
                        value.onclick = this.watchLinkClick;
                        value.onmouseup = this.watchLinkMouseUp;
                    }else if(url_kind=="mylist" || url_kind=="user"){
                        value.onclick = this.mylistLinkClick;
                        value.onmouseup = this.mylistLinkMouseUp;
                    }else if(url_kind=="pound"){
                        value.onclick = (e) =>{
                            e.preventDefault(); 
                            e.stopPropagation();
                            this.poundLink(e);
                        };
                    }else{
                        value.onclick = (e) =>{
                            e.preventDefault();
                            return false;
                        };
                        value.onmouseup = this.linkMouseUp;
                    }
                });
            }
        });
    },
    async setupUserIconCache(){
        this.user_icon_cache_enable = await myapi.ipc.UserIconCache.enable();
        if(!this.user_icon_cache_enable){
            return;
        }

        this.$(".user-thumbnail").onload = async (e) => {
            if(!this.is_saved){
                return;
            }
            /** @type {HTMLImageElement} */
            const img = e.target;
            try {
                if(!await myapi.ipc.UserIconCache.has(img.src)){
                    myapi.ipc.UserIconCache.set(img.src, getBase64(img)); 
                }
            } catch (error) {
                logger.debug(`user_icon_cache.set, url=${img.src}, error=${error}`);
            }
        };
    },
    /**
     * 
     * @param {string} url 
     */
    async updateUserIcon(url){
        if(this.current_user_icon_url == url){
            return;
        }

        this.current_user_icon_url = url;
        
        if(this.is_saved && this.user_icon_cache_enable){         
            this.state.user_thumbnail_url = await myapi.ipc.UserIconCache.get(url);
        }else{
            this.state.user_thumbnail_url = url;
        }
        this.update();
    },
    async onclickPopupDescription(e) { // eslint-disable-line no-unused-vars
        const elm = this.$(".user-container-popup");
        elm.style.display = "";

        const rect = this.$(".user-container").getBoundingClientRect();
        elm.style.top = (rect.top + 5)+ "px";

        const user_info_elm = this.$(".user-container-popup > .user-info");
        const user_info_height = user_info_elm.clientHeight;

        // ポップアップの高さをwindow内に収める
        const popup_height = elm.clientHeight;
        const max_height = window.innerHeight - rect.top - 30;
        if(popup_height > max_height){
            elm.style.height = max_height + "px";

            const elm_user_name = this.$(".user-container-popup .user-name");
            const new_height = max_height - elm_user_name.clientHeight - user_info_height + 6;
            const elm_description = this.$(".user-container-popup > .user-description");  
            elm_description.style.height = new_height + "px";
        }

        await this.updateUserIcon(this.user_icon_url);
    },
    closePopupDescription() {
        const elm = this.$(".user-container-popup");
        if(elm){
            elm.style.display = "none";
        }
    },
    onclickCloseDescription(e) { // eslint-disable-line no-unused-vars
        this.closePopupDescription();
    },
    async popupDescriptionMenu(type, text) {
        if(type=="watch"){
            const video_id = text;
            await myapi.ipc.popupContextMenu("player-watch-link", {
                video_id: video_id,
                url: NicoURL.getWatchURL(video_id)
            });
        }
        if(type=="mylist" || type=="user"){
            const mylist_id = text;
            await myapi.ipc.popupContextMenu("player-mylist-link", {
                mylist_id: mylist_id,
                url: NicoURL.getMylistURL(mylist_id)
            });
        }
        if(type=="text"){
            await myapi.ipc.popupContextMenu("player-text", {
                text: text
            });
        }
    },
    async oncontextmenu(e) {
        if(e.button !== 2){
            return;
        }
        
        const text = document.getSelection().toString();
        if(text==""){
            return;
        }

        if(/^sm\d+/.test(text)){
            const video_id = text.match(/sm\d+/)[0];
            await this.popupDescriptionMenu("watch", video_id);
            return;
        }
        if(/^mylist\/\d+/.test(text)){
            const mylist_id = text;
            await this.popupDescriptionMenu("mylist", mylist_id);
            return;
        }
        if(/^user\/\d+/.test(text)){
            const mylist_id = text;
            await this.popupDescriptionMenu("user", mylist_id);
            return;
        }

        await this.popupDescriptionMenu("text", text);
    },
    onclickUserListLink(e) { // eslint-disable-line no-unused-vars
        if(!this.user_id){
            return;
        }
        myapi.ipc.MyList.load(`user/${this.user_id}`);
    }
};