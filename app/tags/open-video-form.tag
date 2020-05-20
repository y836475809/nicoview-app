<open-video-form>
    <style scoped>
        :scope {
            --form-width: 300px;
            --form-height: 40px;
            --label-width: 40px;
            --btn-width: 30px;
        }
        .open-form {
            display: flex;
            position: fixed;
            width: var(--form-width);
            height: var(--form-height);
            left: calc(50% - var(--form-width));
            top: calc(50% - var(--form-height));
            background-color:white;
            border-radius: 2px;
            border: 1px solid gray;
            z-index: 10;
            padding: 5px;
        }
        .open-form > .label {
            width: var(--label-width);
            user-select: none;
        }
        .open-form > input {
            width: calc(100% - var(--label-width) - var(--btn-width) * 2);
            margin-left: 5px;
        }
        .open-form > input:focus {
            outline: none;
        }
        .open-form > .button {
            width: var(--btn-width);
            color: gray;
            user-select: none;
            cursor: pointer;
        }
        .open-form > .button:hover {
            color: black;
        }
    </style>

    <div class="open-form">
        <div class="label center-hv">動画ID</div>
        <input type="text" onkeydown={onkeydownPlay}>
        <div class="button center-hv" title="再生" onclick={onclickPlay}>
            <i class="fas fa-play"></i>
        </div>
        <div class="button center-hv" title="閉じる" onclick={onclickClose}>
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

        const playByVideoID = () => {
            const elm = this.root.querySelector(".open-form > input");
            const video_id = elm.value;
            if(!video_id) {
                return;
            }
            ipcRenderer.send(IPC_CHANNEL.PLAY_BY_VIDEO_ID, {
                video_id: video_id,
                time: 0
            }); 
        }

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

            const elm = this.root.querySelector(".open-form > input");
            elm.value = "";
            elm.focus();
        });

        this.on("mount", () => {
            formVisible(false);
        });
    </script>    
</open-video-form>  