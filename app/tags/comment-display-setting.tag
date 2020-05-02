<comment-display-setting>
    <style scoped>
        :scope {
            font-size: 1.2em;
            --control-height: 25px;
        }
        
        .param-container {
            width: 100%;
            height: 50px;
            padding: 10px;
            user-select: none;
        }

        .param-label {
            height: 30px;
        }

        .param-space {
            height: 10px;
        }
    </style>

    <div class="param-container">
        <div class="param-label center-v">コメント表示時間</div>
        <div>
            <label each={item in duration_items} >
                <input type="radio" name="duration" value={item} 
                    onchange={onchangeDuration.bind(this,item)}>{item}秒
            </label>
        </div>
    </div>
    <div class="param-space"></div>
    <div class="param-container">
        <div class="param-label center-v">コメントfps</div>
        <div>
            <label each={item in fps_items} >
                <input type="radio" name="fps" value={item} 
                    onchange={onchangeFPS.bind(this,item)}>{item}fps
            </label>
        </div>
    </div>
    <div class="param-space"></div>
    <div class="param-container">
        <div class="param-label center-v">コメント表示数</div>
        <input class="comment-do-limit-checkbox" type="checkbox" 
        onclick={onclickLimitCommentCheck} /><label>表示数を制限</label>
    </div>
    <script>
        /* globals */
        const { IPCClient } = window.IPC;

        const obs_dialog = this.opts.obs;

        this.duration_items = [3, 4, 5];
        this.fps_items = [10, 60];
        const default_params = {
            duration_sec: 4,
            fps: 10,
            do_limit: true
        }

        const changeParams = async (name, value) => {
            const params = await IPCClient.action("config", "get", { key: "comment", value: default_params });
            params[name] = value;
            await IPCClient.action("config", "set", { key: `comment.${name}`, value: value });
            obs_dialog.trigger("player-main-page:update-comment-display-params", params);
        };

        this.onchangeDuration = async (item, e) => {
            await changeParams("duration_sec", parseInt(item));
        };

        this.onchangeFPS = async (item, e) => {
            await changeParams("fps", parseInt(item));
        };

        this.onclickLimitCommentCheck = async (e) => {
            const do_limit = e.target.checked;
            await IPCClient.action("config", "set", { key:"comment.do_limit", value:do_limit });
            obs_dialog.trigger("player-main-page:update-comment-display-limit", {do_limit});
        };

        const setup = (name, items, value) => {
            const index = items.findIndex(item => item === value);
            const elms = this.root.querySelectorAll(`input[name='${name}']`);
            elms[index].checked = true;
        };

        this.on("mount", async () => {
            const params = await IPCClient.action("config", "get", { key:"comment", value:default_params });
            setup("duration", this.duration_items, params.duration_sec);
            setup("fps", this.fps_items, params.fps);

            const ch_elm = this.root.querySelector(".comment-do-limit-checkbox");
            ch_elm.checked = params.do_limit;
        });
    </script>
</comment-display-setting>