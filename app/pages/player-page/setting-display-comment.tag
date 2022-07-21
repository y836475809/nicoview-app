<setting-display-comment>
    <style>
        .param-container {
            width: 100%;
            user-select: none;
        }
    </style>

    <div class="setting-section">
        <div class="center-v title">コメント表示</div>
        <div class="setting-params">
            <div class="param-label center-v">表示時間</div>
            <label class="cursor-pointer" each={item in duration_items} >
                <input type="radio" name="duration" value={item} 
                    onchange={onchangeDuration.bind(this,item)}>{item}秒
            </label>
            <hr>
            <div class="param-label center-v">fps</div>
            <label class="cursor-pointer" each={item in fps_items} >
                <input type="radio" name="fps" value={item} 
                    onchange={onchangeFPS.bind(this,item)}>{item}fps
            </label>
            <hr>
            <label class="cursor-pointer">
                <input class="comment-do-limit-checkbox" type="checkbox" 
                    onclick={onclickLimitCommentCheck} />表示数を制限
            </label>
        </div>
    </div>
    <div class="setting-section">
        <div class="setting-params">
            <label class="cursor-pointer">
                <input class="auto-sync-checkbox" type="checkbox" 
                    onclick={onclickAutoSyncCheck} />コメントと動画の同期調整を行う
            </label>
            <hr>
            <div class="param-label center-v">以下の間隔で同期を調整する</div>
            <label class="cursor-pointer" each={item in sync_interval_items} >
                <input type="radio" name="sync_interval" value={item} 
                    onchange={onchangeAutoSyncInterval.bind(this,item)}>{item}秒
            </label>
            <hr>
            <div class="param-label center-v">以下の値より同期がずれたら調整を行う</div>
            <label class="cursor-pointer" each={item in sync_threshold_items} >
                <input type="radio" name="sync_threshold" value={item} 
                    onchange={onchangeAutoSyncThreshold.bind(this,item)}>{item}秒
            </label>
        </div>
    </div>
    <script>
        /* globals riot */
        const myapi = window.myapi;
        const player_obs = riot.obs;

        const default_params = {
            duration_sec: 4,
            fps: 10,
            do_limit: true,
            auto_sync_checked: true,
            auto_sync_interval: 30,
            auto_sync_threshold: 0.1
        };

        const setup = (tag, name, items, value) => {
            const index = items.findIndex(item => item === value);
            const elms = tag.$$(`input[name='${name}']`);
            elms[index].checked = true;
        };

        export default {
            duration_items:[3, 4, 5],
            fps_items:[10, 60],
            sync_interval_items:[10, 30, 60, 120],
            sync_threshold_items:[0.05, 0.1],
            onBeforeMount() {
                player_obs.onReturn("setting-display-comment:get-default_params", ()=>{
                    return default_params;
                });
            },
            async onMounted() {
                const params = await myapi.ipc.Config.get("comment", default_params);
                
                setup(this, "duration", this.duration_items, params.duration_sec);
                setup(this, "fps", this.fps_items, params.fps);

                const ch_elm = this.$(".comment-do-limit-checkbox");
                ch_elm.checked = params.do_limit;

                const auto_sync_ch_elm = this.$(".auto-sync-checkbox");
                auto_sync_ch_elm.checked = params.auto_sync_checked;
                setup(this, "sync_interval", this.sync_interval_items, params.auto_sync_interval);
                setup(this, "sync_threshold", this.sync_threshold_items, params.auto_sync_threshold);
            },
            async changeParams(name, value, is_trigger=true){
                const params = await myapi.ipc.Config.get("comment", default_params);
                params[name] = value;
                await myapi.ipc.Config.set(`comment.${name}`, value);
                if(is_trigger){
                    player_obs.trigger("player-video:update-comment-display-params", params);
                }
            },
            async onchangeDuration(item, e) { // eslint-disable-line no-unused-vars
                await this.changeParams("duration_sec", parseInt(item));
            },
            async onchangeFPS(item, e) { // eslint-disable-line no-unused-vars
                await this.changeParams("fps", parseInt(item));
            },
            async onclickLimitCommentCheck(e) {
                const do_limit = e.target.checked;
                await myapi.ipc.Config.set("comment.do_limit", do_limit);
                player_obs.trigger("player-main-page:update-comment-display-limit", {do_limit});
            },
            async onclickAutoSyncCheck(e) {
                const checked = e.target.checked;
                await this.changeParams("auto_sync_checked", checked, false);
            },
            async onchangeAutoSyncInterval(item, e) { // eslint-disable-line no-unused-vars
                const interval = item;
                await this.changeParams("auto_sync_interval", interval, false);
            },
            async onchangeAutoSyncThreshold(item, e) { // eslint-disable-line no-unused-vars
                const threshold = item;
                await this.changeParams("auto_sync_threshold", threshold, false);
            }
        };
    </script>
</setting-display-comment>