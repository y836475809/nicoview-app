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
        onclick={this.onclickLimitCommentCheck} /><label>表示数を制限</label>
    </div>
    <script>
        /* globals app_base_dir */
        const { SettingStore } = require(`${app_base_dir}/js/setting-store`);

        const obs_dialog = this.opts.obs;

        this.duration_items = [3, 4, 5];
        this.fps_items = [10, 60];

        const changeParams = (name, value) => {
            const params = SettingStore.getCommentParams();
            params[name] = value;
            SettingStore.setCommentParams(params);
            obs_dialog.trigger("player-main-page:update-comment-display-params", params);
        };

        this.onchangeDuration = (item, e) => {
            changeParams("duration_sec", item);
        };

        this.onchangeFPS = (item, e) => {
            changeParams("fps", item);
        };

        this.onclickLimitCommentCheck = (e) => {
            const do_limit = e.target.checked;
            const params = SettingStore.getCommentParams();
            params["do_limit"] = do_limit;
            SettingStore.setCommentParams(params);
            obs_dialog.trigger("player-main-page:update-comment-display-limit", {do_limit});
        };

        const setup = (name, items, value) => {
            const index = items.findIndex(item => item === value);
            const elms = this.root.querySelectorAll(`input[name='${name}']`);
            elms[index].checked = true;
        };

        this.on("mount", () => {
            const params = SettingStore.getCommentParams();
            setup("duration", this.duration_items, params.duration_sec);
            setup("fps", this.fps_items, params.fps);

            const ch_elm = this.root.querySelector(".comment-do-limit-checkbox");
            ch_elm.checked = params.do_limit;
        });
    </script>
</comment-display-setting>