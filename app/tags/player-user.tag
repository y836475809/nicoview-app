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
            padding-left: 5px;
            margin-right: 10px;
        }

        .user-container-normal {
            width: 100%;
            height: 100%;
            border: 1px solid var(--control-border-color);
        }
        .user-container-normal .user-name {
            height: var(--user-name-height); 
            line-height: var(--user-name-height); 
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
            height: var(--user-thumbnail-size); 
            line-height: var(--user-thumbnail-size); 
        }
        .user-container-popup .icon-button {
            margin-left: auto;
        }

        .user-description {
            padding: 2px;
            width: 100%;
            height: 100%;
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

            /* TODO 外部に出す？ */
            max-width: 400px;
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
            <div style="display: flex;">
                <img class="user-thumbnail" src={user_thumbnail_url}>
                <div class="user-name">投稿者: {user_nickname}</div>
                <div class="icon-button center-hv" onclick={onclickCloseDescription}>
                    <i title="閉じる" class="icon fas fa-times"></i>
                </div>
            </div>
            <div class="user-description {user_description_class}" onmouseup={oncontextmenu}></div>
        </div>
    </div>
    
    <script>
        /* globals */
        const { remote, clipboard, ipcRenderer } = window.electron;
        const { Menu } = remote;
        const { IPC_CHANNEL } = window.IPC_CHANNEL;

        const obs = this.opts.obs; 

        this.user_thumbnail_url = "";
        this.user_description_class = "text";

        const createWatchLinkMenu = (video_id) => {
            const menu_templete = [
                { label: "再生", click() {
                    ipcRenderer.send(IPC_CHANNEL.PLAY_BY_VIDEO_ONLINE, {
                        video_id: video_id,
                        time: 0
                    }); 
                }},
                { label: "オンラインで再生", click() {
                    ipcRenderer.send(IPC_CHANNEL.PLAY_BY_VIDEO_ONLINE, {
                        video_id: video_id,
                        time: 0
                    });
                }},
            ];
            return Menu.buildFromTemplate(menu_templete);
        };

        const watchLinkClick = (e) => {
            e.preventDefault(); 
            e.stopPropagation();

            const paths = e.target.href.split("/");
            const video_id = paths.pop();

            ipcRenderer.send(IPC_CHANNEL.PLAY_BY_VIDEO_ID, {
                video_id: video_id,
                time: 0
            }); 
            
            return false;
        };

        const watchLinkMouseUp = (e) => {
            e.preventDefault(); 
            e.stopPropagation();

            const paths = e.target.href.split("/");
            const video_id = paths.pop();
            
            if(e.button === 2){
                createWatchLinkMenu(video_id).popup({window: remote.getCurrentWindow()}); 
            }
            return false;
        };

        const mylistLinkClick = (e) => {
            e.preventDefault(); 
            e.stopPropagation();
            
            const paths = e.target.href.split("/");
            const mylist_id = paths.pop();
            obs.trigger("player-main-page:load-mylist", mylist_id);
            return false;
        };

        const setDescription = (description) => {
            const content_elms = this.root.querySelectorAll(".user-description");
            content_elms.forEach(content_elm => {    
                content_elm.innerHTML = description;

                if(content_elm.childElementCount==0){
                    this.user_description_class = "text";
                }else{
                    this.user_description_class = "html";
                    const a_tags = content_elm.querySelectorAll("a");
                    a_tags.forEach(value=>{
                        if(/^https:\/\/www.nicovideo.jp\/watch\//.test(value.href)){
                            value.onclick = watchLinkClick;
                            value.onmouseup = watchLinkMouseUp;
                        }else if(/^https:\/\/www.nicovideo.jp\/mylist\//.test(value.href)){
                            value.onclick = mylistLinkClick;
                        }else{
                            value.onclick = (e) =>{
                                e.preventDefault();
                                return false;
                            };
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

            // ポップアップの高さをwindow内に収める
            const popup_height = elm.clientHeight;
            const max_height = window.innerHeight - rect.top - 30;
            if(popup_height > max_height){
                elm.style.height = max_height + "px";

                const elm_user_name = this.root.querySelector(".user-container-popup .user-name");
                const new_height = max_height - elm_user_name.clientHeight - 20;
                const elm_description = this.root.querySelector(".user-container-popup > .user-description");  
                elm_description.style.height = new_height + "px";
            }

            if(this.user_thumbnail_url != this.user_icon_url){
                this.user_thumbnail_url = this.user_icon_url;
            }
        };

        this.onclickCloseDescription = (e) => {
            const elm = this.root.querySelector(".user-container-popup");
            elm.style.display = "none";
        };

        const popupDescriptionMenu = (type, text) => {
            let menu_template = null;
            if(type=="watch"){
                const video_id = text;
                menu_template = createWatchLinkMenu(video_id);
            }
            if(type=="mylist"){
                const mylist_id = text;
                const menu_templete = [
                    { label: "mylistを開く", click() {
                        obs.trigger("player-main-page:load-mylist", mylist_id);
                    }}
                ];
                menu_template = Menu.buildFromTemplate(menu_templete);
            }
            if(type=="text"){
                const menu_templete = [
                    { label: "コピー", click() {
                        clipboard.writeText(text);
                    }}
                ];
                menu_template = Menu.buildFromTemplate(menu_templete);    
            }   
            menu_template.popup({window: remote.getCurrentWindow()});
        };
        this.oncontextmenu = (e) => {
            if(e.button !== 2){
                return;
            }
            
            const text = document.getSelection().toString();
            if(text==""){
                return;
            }

            if(/^sm\d+/.test(text)){
                const video_id = text.match(/sm\d+/)[0];
                popupDescriptionMenu("watch", video_id);
                return;
            }
            if(/^mylist\/\d+/.test(text)){
                const mylist_id = text.match(/\d+/)[0]; 
                popupDescriptionMenu("mylist", mylist_id);
                return;
            }

            popupDescriptionMenu("text", text);
        };

        this.on("mount", () => {  
    
        });

        obs.on("player-user:set-data", args => {
            const { user_nickname, user_icon_url, description } = args;
            this.user_nickname = user_nickname;
            this.user_icon_url = user_icon_url;
            setDescription(description);

            this.update();
        });
    </script>
</player-user>