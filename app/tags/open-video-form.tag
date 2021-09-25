<open-video-form>
    <style scoped>
        :scope {
            --form-width: 400px;
            --form-height: 90px;
            --btn-width: 20px;
        }
        .open-form {
            position: absolute;
            width: var(--form-width);
            height: var(--form-height);
            left: calc(50% - var(--form-width) / 2);
            top: calc(100% - var(--form-height) - 20px);
            background-color:white;
            border-radius: 5px;
            border: 1px solid gray;
            z-index: 999;
            padding: 10px;
        }
        .open-form input {
            font-size: 1.2em;
            width: 100%;
            height: 30px;
        }
        .open-form .button { 
            display: inline-block;
            text-align: center;
            border: 1px solid #aaa;
            border-radius: 2px;
            width: 100px;
            height: 30px;
            line-height: 30px;
            cursor: pointer; 
            user-select: none;
            margin-top: 10px;
            margin-left: 10px;
        }   
        .open-form .button:hover { 
            background-color: skyblue;
        }
    </style>

    <div class="open-form" onmouseup={stopProp} onmousedown={stopProp} onkeyup={stopProp}>
        <input type="text" onkeydown={onkeydownPlay}>
        <div style="display: flex; width: 200px; margin-left: auto;">
            <div class="button" onclick={onclickPlay}>再生</div>
            <div class="button" onclick={onclickClose}>閉じる</div>
        </div>
    </div>

    <script>
        /* globals */
        const { Command } = window.Command;
        const { NICO_URL } = window.NicoURL;

        this.stopProp = (e) => {
            e.stopPropagation();
        };

        const formVisible = (visible) => {
            const elm = this.root.querySelector(".open-form");
            elm.style.display = visible===true?"":"none";
        };

        const isURL = (value) => {
            return value.startsWith(`${NICO_URL.VIDEO}/watch/`);
        };

        const getVideoID = (value) => {
            if(isURL(value)){
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
            const online = false; // ローカル再生を優先
            Command.play({
                id: video_id,
                time: 0
            }, online);
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

        this.on("mount", () => {
            formVisible(false);
        });

        this.opts.obs.on("show", () => {
            formVisible(true);
            const elm = this.root.querySelector(".open-form input");
            elm.value = "";
            elm.focus();
        });
    </script>    
</open-video-form>  