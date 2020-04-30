<open-video-form>
    <style scoped>
        :scope {
            --form-width: 300px;
            --form-height: 30px;
        }
        .open-form-none {
            display: none;
        }
        .open-form {
            display: flex;
            position: fixed;
            width: var(--form-width);
            height: var(--form-height);
            left: calc(50% - var(--form-width));
            top: calc(50% - var(--form-height));
            background-color: rgba(209, 203, 203);
            border-radius: 2px;
            z-index: 10;
        }
        .open-form .label {
            width: 20px;
            margin: 5px;    
            user-select: none;
        }
        .open-form input {
            width: calc(var(--form-width) 
                        - 20px - 50px - 20px);
            margin: 3px;
        }
        .open-form input:focus {
            outline: none;
        }
        .open-form .play-button {
            width: 50px;
            margin: 2px 0 2px 0;      
        }
        .open-form .close-button {
            width: 20px;
            margin: 2px;   
            cursor: pointer;   
            user-select: none;
        }
    </style>

    <div class="{video_id_form_display}">
        <div class="open-form">
            <div class="label center-hv">ID</div>
            <input type="text" onkeydown={onkeydownPlay}>
            <button class="play-button" onclick={onclickPlay}>再生</button>
            <div class="close-button center-hv" title="閉じる" onclick={onclickClose}>x</div>
        </div>
    </div>

    <script>
        /* globals */
        const { ipcRenderer } = window.electron;
        const { IPC_CHANNEL } = window.IPC_CHANNEL;

        const obs = this.opts.obs; 

        this.video_id_form_display = "open-form-none";

        const playByVideoID = () => {
            const elm = this.root.querySelector(".open-form input");
            const video_id = elm.value;
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
            this.video_id_form_display = "open-form-none";
        };

        obs.on("open-video-form:show", () => {
            this.video_id_form_display = "";
            this.update();

            const elm = this.root.querySelector(".open-form input");
            elm.focus();
        });

    </script>    
</open-video-form>  