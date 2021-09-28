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
        export default {
            onBeforeMount(props) {
                this.Command = window.Command.Command;
                this.NICO_URL = window.NicoURL.NICO_URL;

                props.obs.on("show", () => {
                    this.formVisible(true);
                    const elm = this.root.querySelector(".open-form input");
                    elm.value = "";
                    elm.focus();
                });
            },
            onMounted() {
                this.formVisible(false);
            },
            stopProp(e) {
                e.stopPropagation();
            },
            formVisible(visible) {
                const elm = this.root.querySelector(".open-form");
                elm.style.display = visible===true?"":"none";
            },
            isURL(value) {
                return value.startsWith(`${this.NICO_URL.VIDEO}/watch/`);
            },
            getVideoID(value) {
                if(this.isURL(value)){
                    return value.split("/").pop();
                }else{
                    return value;
                }
            },
            playByVideoID() {
                const elm = this.root.querySelector(".open-form input");
                const video_id = this.getVideoID(elm.value);
                if(!video_id) {
                    return;
                }
                const online = false; // ローカル再生を優先
                this.Command.play({
                    id: video_id,
                    time: 0
                }, online);
            },
            onkeydownPlay(e) {
                if(e.code == "Enter"){
                    this.playByVideoID();
                }
            },
            onclickPlay(e) {
                this.playByVideoID();
            },
            onclickClose(e) {
                this.formVisible(false);
            }
        };
    </script>    
</open-video-form>  