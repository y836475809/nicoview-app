<open-video-form>
    <style>
        :host {
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
        const NICO_URL = window.NicoURL;

        const formVisible = (tag, visible) => {
            const elm = tag.$(".open-form");
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
        const playByVideoID = (tag) => {
            const elm = tag.$(".open-form input");
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

        export default {
            onBeforeMount(props) {
                props.obs.on("show", () => {
                    formVisible(this, true);
                    const elm = this.$(".open-form input");
                    elm.value = "";
                    elm.focus();
                });
            },
            onMounted() {
                formVisible(this, false);
            },
            stopProp(e) {
                e.stopPropagation();
            },
            onkeydownPlay(e) {
                if(e.code == "Enter"){
                    playByVideoID(this,);
                }
            },
            onclickPlay(e) { // eslint-disable-line no-unused-vars
                playByVideoID(this);
            },
            onclickClose(e) { // eslint-disable-line no-unused-vars
                formVisible(this, false);
            }
        };
    </script>    
</open-video-form>  