<setting-display-comment>
    <style scoped>
        .param-container {
            width: 100%;
            user-select: none;
        }
    </style>

    <div class="setting-section">
        <div class="setting-params">
            <div class="title">コメント表示</div>
            <hr>
            <div class="param-label center-v">表示時間</div>
            <label each={item in duration_items} >
                <input type="radio" name="duration" value={item} 
                    onchange={onchangeDuration.bind(this,item)}>{item}秒
            </label>
            <hr>
            <div class="param-label center-v">fps</div>
            <label each={item in fps_items} >
                <input type="radio" name="fps" value={item} 
                    onchange={onchangeFPS.bind(this,item)}>{item}fps
            </label>
            <hr>
            <input class="comment-do-limit-checkbox" type="checkbox" 
            onclick={onclickLimitCommentCheck} /><label>表示数を制限</label>
        </div>
    </div>
    <div class="setting-section">
        <div class="setting-params">
            <div class="title">コメント同期調整</div>
            <hr>
            <input class="auto-sync-checkbox" type="checkbox" 
            onclick={onclickAutoSyncCheck} /><label>同期調整を行う</label>
            <hr>
            <div class="param-label center-v">以下の間隔で同期を調整する</div>
            <label each={item in sync_interval_items} >
                <input type="radio" name="sync_interval" value={item} 
                    onchange={onchangeAutoSyncInterval.bind(this,item)}>{item}秒
            </label>
            <hr>
            <div class="param-label center-v">以下の値より同期がずれたら調整を行う</div>
            <label each={item in sync_threshold_items} >
                <input type="radio" name="sync_threshold" value={item} 
                    onchange={onchangeAutoSyncThreshold.bind(this,item)}>{item}秒
            </label>
        </div>
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
            do_limit: true,
            auto_sync_checked: true,
            auto_sync_interval: 30,
            auto_sync_threshold: 0.1
        };

        this.sync_interval_items = [10, 30, 60, 120];
        this.sync_threshold_items = [0.05, 0.1];

        obs_dialog.on("setting-display-comment:get-default_params", (cb)=>{
            cb(default_params);
        });

        const changeParams = async (name, value, is_trigger=true) => {
            const params = await IPCClient.request("config", "get", { key: "comment", value: default_params });
            params[name] = value;
            await IPCClient.request("config", "set", { key: `comment.${name}`, value: value });
            if(is_trigger){
                obs_dialog.trigger("player-main-page:update-comment-display-params", params);
            }
        };

        this.onchangeDuration = async (item, e) => {
            await changeParams("duration_sec", parseInt(item));
        };

        this.onchangeFPS = async (item, e) => {
            await changeParams("fps", parseInt(item));
        };

        this.onclickLimitCommentCheck = async (e) => {
            const do_limit = e.target.checked;
            await IPCClient.request("config", "set", { key:"comment.do_limit", value:do_limit });
            obs_dialog.trigger("player-main-page:update-comment-display-limit", {do_limit});
        };

        this.onclickAutoSyncCheck = async (e) => {
            const checked = e.target.checked;
            await changeParams("auto_sync_checked", checked, false);
        };

        this.onchangeAutoSyncInterval = async (item, e) => {
            const interval = item;
            await changeParams("auto_sync_interval", interval, false);
        };

        this.onchangeAutoSyncThreshold = async (item, e) => {
            const threshold = item;
            await changeParams("auto_sync_threshold", threshold, false);
        };

        const setup = (name, items, value) => {
            const index = items.findIndex(item => item === value);
            const elms = this.root.querySelectorAll(`input[name='${name}']`);
            elms[index].checked = true;
        };

        this.on("mount", async () => {
            const params = await IPCClient.request("config", "get", { key:"comment", value:default_params });
            
            setup("duration", this.duration_items, params.duration_sec);
            setup("fps", this.fps_items, params.fps);

            const ch_elm = this.root.querySelector(".comment-do-limit-checkbox");
            ch_elm.checked = params.do_limit;

            const auto_sync_ch_elm = this.root.querySelector(".auto-sync-checkbox");
            auto_sync_ch_elm.checked = params.auto_sync_checked;
            setup("sync_interval", this.sync_interval_items, params.auto_sync_interval);
            setup("sync_threshold", this.sync_threshold_items, params.auto_sync_threshold);
        });
    </script>
</setting-display-comment>