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
        <div class="param-label center-v">コメント表示時間(秒)</div>
        <div>
            <label each={item in duration_items} >
                <input type="radio" name="duration" value={item} 
                    onchange={onchangeDuration.bind(this,item)}>{item}
            </label>
        </div>
    </div>
    <div class="param-space"></div>
    <div class="param-container">
        <div class="param-label center-v">コメントFPS</div>
        <div>
            <label each={item in fps_items} >
                <input type="radio" name="fps" value={item} 
                    onchange={onchangeFPS.bind(this,item)}>{item}
            </label>
        </div>
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

        const setup = (name, items, value) => {
            const index = items.findIndex(item => item === value);
            const elms = this.root.querySelectorAll(`input[name='${name}']`);
            elms[index].checked = true;
        };

        this.on("mount", () => {
            const params = SettingStore.getCommentParams();
            setup("duration", this.duration_items, params.duration_sec);
            setup("fps", this.fps_items, params.fps);
        });
    </script>
</comment-display-setting>