<open-video-form>
    <style scoped>
        :scope {
            --form-width: 400px;
            --form-height: 80px;
            --btn-width: 30px;
        }
        .open-form {
            position: fixed;
            width: var(--form-width);
            height: var(--form-height);
            left: calc(50% - var(--form-width));
            top: calc(50% - var(--form-height));
            background-color:white;
            border-radius: 2px;
            border: 1px solid gray;
            z-index: 999;
            padding: 10px 10px 5px 10px;
        }
        .open-form .label {
            user-select: none;
            margin-bottom: 10px;
        }
        .open-form input {
            font-size: 1.2em;
            width: calc(100% - var(--btn-width));
        }
        .open-form input:focus {
            outline: none;
        }
        .open-form .button {
            width: var(--btn-width);
            color: gray;
            user-select: none;
            cursor: pointer;
        }
        .open-form .button:hover {
            color: black;
        }
        .open-form .button.close {
            position: absolute;
            top: 5px;
            right: 0px;
        }
    </style>

    <div class="open-form">
        <div class="label center-v">動画ID:保存済みを優先で再生&nbsp;&nbsp;URL:オンラインで再生</div>
        <div style="display: flex;">
            <input type="text" onkeydown={onkeydownPlay}>
            <div class="button center-hv" title="再生" onclick={onclickPlay}>
                <i class="fas fa-play"></i>
            </div>
        </div>
        <div class="button close center-hv" title="閉じる" onclick={onclickClose}>
            <i class="fas fa-times"></i>
        </div>
    </div>

    <script>
        /* globals */
        const { ipcRenderer } = window.electron;
        const { IPC_CHANNEL } = window.IPC_CHANNEL;

        const obs = this.opts.obs; 

        const formVisible = (visible) => {
            const elm = this.root.querySelector(".open-form");
            elm.style.display = visible===true?"":"none";
        };

        const isURL = (value) => {
            return value.startsWith("https://www.nicovideo.jp") === true
                || value.startsWith("http://www.nicovideo.jp") === true;
        };

        const getVideoID = (value) => {
            if(isURL(value) === true){
                return value.split("/").pop();
            }else{
                return value;
            }
        };

        const playByVideoID = () => {
            const elm = this.root.querySelector(".open-form input");
            const video_id = getVideoID(elm.value);
            if(!video_id) {
                return;
            }
            const params = {
                video_id: video_id,
                time: 0
            };
            if(isURL(elm.value) === true){
                ipcRenderer.send(IPC_CHANNEL.PLAY_BY_VIDEO_ONLINE, params); 
            }else{
                ipcRenderer.send(IPC_CHANNEL.PLAY_BY_VIDEO_ID, params); 
            }
        };

        this.onkeydownPlay = (e) => {
            if(e.code == "Enter"){
                playByVideoID();
            }
        };

        this.onclickPlay = (e) => {
            playByVideoID();
        };

        this.onclickClose = (e) => {
            formVisible(false);
        };

        obs.on("show", () => {
            formVisible(true);

            const elm = this.root.querySelector(".open-form input");
            elm.value = "";
            elm.focus();
        });

        this.on("mount", () => {
            formVisible(false);
        });
    </script>    
</open-video-form>  