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
        export default window.RiotJS.SettingDisplayComment;
    </script>
</setting-display-comment>