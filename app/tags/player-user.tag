<player-user>
    <style scoped>
        :scope {
            --user-name-height: 30px;
            --user-thumbnail-size: 60px;
            overflow-x: hidden;
            overflow-y: hidden;
        }    
        
        .user-container {
            width: 100%;
            height: 100%;
            border-radius: 2px;
            margin-right:  5px;
        } 
        .user-thumbnail {
            user-select: none;
            margin: 5px 0 5px 5px; 
            width: var(--user-thumbnail-size); 
            height: var(--user-thumbnail-size); 
        }
        .user-name {
            user-select: none;
            vertical-align: middle;
        }
        .userlist-link {
            margin-top: 5px;
            margin-left: 5px;
            color: blue;
            text-decoration: underline;
            cursor: pointer;
        }

        .user-container-normal {
            width: 100%;
            height: 100%;
            border: 1px solid var(--control-border-color);
        }
        .user-container-normal .user-name {
            margin-left: 5px;
        }

        .user-container-popup {
            position: absolute;
            right: 5px; 
            border: solid 1px #aaa;
            border-radius: 3px;
            background-color: white; 
            box-shadow: 0 8px 10px 1px rgba(0,0,0,0.14), 0 3px 14px 2px rgba(0,0,0,0.12), 0 5px 5px -3px rgba(0,0,0,0.3);
            z-index: 999;
            padding: 5px;          
        }
        .user-container-popup .user-name {
            margin-top: 5px;
            margin-left: 5px;
        }
        .user-container-popup .icon-button {
            margin-left: auto;
        }

        .user-description {
            padding: 2px;
            width: 100%;
            height: 100%;

            /* TODO とりあえずwindow幅50% */
            max-width: 50vw;
            
            border-top: 1px solid var(--control-border-color);
            overflow-x: auto;
            overflow-y: auto;         
        }
        .user-container-normal .user-description {
            height: calc(100% - var(--user-name-height));
        }
        .user-description.html {
            white-space:nowrap; 
        } 
        .user-description.text {
            height: calc(100% - var(--user-name-height));
            white-space: normal;
        } 

        .icon {
            font-size: 20px;
            color: gray;
        }
        .icon:hover {
            color: black;
        }
        .icon-button {
            height: 30px;
            width: 30px;
            cursor: pointer;
        }
    </style>

    <div class="user-container">   
        <div class="user-container-normal">
            <div style="display: flex;" class="center-v">
                <div class="user-name">投稿者: {user_nickname}</div>
                <div class="icon-button center-hv" onclick={onclickPopupDescription}>
                    <i title="ポップアップ表示" class="icon far fa-comment-alt"></i>
                </div>
            </div>
            <div class="user-description {user_description_class}" onmouseup={oncontextmenu}></div>
        </div>
        <div style="display:none;" class="user-container-popup">
            <div class="user-info", style="display: flex;">
                <img class="user-thumbnail" src={user_thumbnail_url}>
                <div>
                    <div class="user-name">投稿者: {getUserNickname()}</div>
                    <div class="userlist-link" onclick={onclickUserListLink}>{getUserListLink()}</div>
                </div>
                <div class="icon-button center-hv" onclick={onclickCloseDescription}>
                    <i title="閉じる" class="icon fas fa-times"></i>
                </div>
            </div>
            <div class="user-description {user_description_class}" onmouseup={oncontextmenu}></div>
        </div>
    </div>
    
    <script>
        /* globals */
        const ipc = window.electron.ipcRenderer;
        const NicoURL = window.NicoURL;
        const { toTimeSec } = window.TimeFormat;

        const obs = this.opts.obs; 

        this.user_thumbnail_url = "";
        this.user_description_class = "text";

        this.getUserNickname = () => {
            return this.user_nickname?this.user_nickname:"未取得";
        };
        this.getUserListLink = () => {
            return this.user_id?`user/${this.user_id}`:"";
        };

        const watchLinkClick = (e) => {
            e.preventDefault(); 
            e.stopPropagation();

            const paths = e.target.href.split("/");
            const video_id = paths.pop();

            ipc.send("app:play-video", {
                video_id: video_id,
                time: 0,
                online: false
            }); 
            
            return false;
        };

        const watchLinkMouseUp = async (e) => {
            e.preventDefault(); 
            e.stopPropagation();

            const paths = e.target.href.split("/");
            const video_id = paths.pop();
            
            if(e.button === 2){ 
                await ipc.invoke("app:popup-player-contextmenu-watchlink", {
                    video_id: video_id,
                    url: e.target.href
                });
            }      
            return false;
        };

        const mylistLinkClick = (e) => {
            e.preventDefault(); 
            e.stopPropagation();
            
            const mylist_id = NicoURL.getMylistID(e.target.href);
            obs.trigger("player-main-page:load-mylist", mylist_id);
            return false;
        };

        const mylistLinkMouseUp = async (e) => {
            e.preventDefault(); 
            e.stopPropagation();

            const mylist_id = NicoURL.getMylistID(e.target.href);
            if(e.button === 2){
                await ipc.invoke("app:popup-player-contextmenu-mylistlink", {
                    mylist_id: mylist_id,
                    url: e.target.href
                });
            }
            return false;
        };

        const linkMouseUp = async (e) => {
            e.preventDefault(); 
            e.stopPropagation();

            if(e.button === 2){
                await ipc.invoke("app:popup-player-contextmenu-link", {
                    url: e.target.href
                });
            }
            return false;
        };

        const poundLink = (e) => {
            const elm = e.target;
            if(elm.classList.contains("seekTime")){
                const seek_time_sec = toTimeSec(e.target.dataset.seektime);
                obs.trigger("player-video:seek", seek_time_sec);
            }
        };

        const setDescription = (description) => {
            const content_elms = this.root.querySelectorAll(".user-description");
            content_elms.forEach(content_elm => {  
                content_elm.scrollTop  = 0;
                content_elm.scrollLeft = 0;

                content_elm.innerHTML = description;

                if(content_elm.childElementCount==0){
                    this.user_description_class = "text";
                }else{
                    this.user_description_class = "html";
                    const a_tags = content_elm.querySelectorAll("a");
                    a_tags.forEach(value=>{
                        const href = value.getAttribute("href");
                        const url_kind = NicoURL.getURLKind(href);
                        if(url_kind=="watch"){
                            value.onclick = watchLinkClick;
                            value.onmouseup = watchLinkMouseUp;
                        }else if(url_kind=="mylist" || url_kind=="user"){
                            value.onclick = mylistLinkClick;
                            value.onmouseup = mylistLinkMouseUp;
                        }else if(url_kind=="pound"){
                            value.onclick = (e) =>{
                                e.preventDefault(); 
                                e.stopPropagation();
                                poundLink(e);
                            };
                        }else{
                            value.onclick = (e) =>{
                                e.preventDefault();
                                return false;
                            };
                            value.onmouseup = linkMouseUp;
                        }
                    });
                }
            });
        };

        this.onclickPopupDescription = (e) => {
            const elm = this.root.querySelector(".user-container-popup");
            elm.style.display = "";

            const rect = this.root.querySelector(".user-container").getBoundingClientRect();
            elm.style.top = (rect.top + 5)+ "px";

            const user_info_elm = this.root.querySelector(".user-container-popup > .user-info");
            const user_info_height = user_info_elm.clientHeight;

            // ポップアップの高さをwindow内に収める
            const popup_height = elm.clientHeight;
            const max_height = window.innerHeight - rect.top - 30;
            if(popup_height > max_height){
                elm.style.height = max_height + "px";

                const elm_user_name = this.root.querySelector(".user-container-popup .user-name");
                const new_height = max_height - elm_user_name.clientHeight - user_info_height + 6;
                const elm_description = this.root.querySelector(".user-container-popup > .user-description");  
                elm_description.style.height = new_height + "px";
            }

            if(this.user_icon_url && this.user_thumbnail_url != this.user_icon_url){
                this.user_thumbnail_url = this.user_icon_url;
            }
        };

        const closePopupDescription = () => {
            const elm = this.root.querySelector(".user-container-popup");
            if(elm){
                elm.style.display = "none";
            }
        };

        this.onclickCloseDescription = (e) => {
            closePopupDescription();
        };

        const popupDescriptionMenu = async (type, text) => {
            if(type=="watch"){
                const video_id = text;
                await ipc.invoke("app:popup-player-contextmenu-watchlink", {
                    video_id: video_id,
                    url: NicoURL.getWatchURL(video_id)
                });
            }
            if(type=="mylist" || type=="user"){
                const mylist_id = text;
                await ipc.invoke("app:popup-player-contextmenu-mylistlink", {
                    mylist_id: mylist_id,
                    url: NicoURL.getMylistURL(mylist_id)
                });
            }
            if(type=="text"){
                await ipc.invoke("app:popup-player-contextmenu-text", {
                    text: text
                });  
            }
        };
        
        this.oncontextmenu = async (e) => {
            if(e.button !== 2){
                return;
            }
            
            const text = document.getSelection().toString();
            if(text==""){
                return;
            }

            if(/^sm\d+/.test(text)){
                const video_id = text.match(/sm\d+/)[0];
                await popupDescriptionMenu("watch", video_id);
                return;
            }
            if(/^mylist\/\d+/.test(text)){
                const mylist_id = text;
                await popupDescriptionMenu("mylist", mylist_id);
                return;
            }
            if(/^user\/\d+/.test(text)){
                const mylist_id = text;
                await popupDescriptionMenu("user", mylist_id);
                return;
            }

            await popupDescriptionMenu("text", text);
        };

        this.onclickUserListLink = (e) => {
            if(!this.user_id){
                return;
            }
            obs.trigger("player-main-page:load-mylist", `user/${this.user_id}`);
        };

        this.on("mount", () => {  
    
        });

        obs.on("player-user:set-data", args => {
            const { user_id, user_nickname, user_icon_url, description } = args;

            closePopupDescription();

            this.user_id = user_id;
            this.user_nickname = user_nickname;
            this.user_icon_url = user_icon_url;
            setDescription(description);

            this.update();
        });
    </script>
</player-user>