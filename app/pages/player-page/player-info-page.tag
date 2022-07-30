<player-info-page>
    <style>
        :host {
            --video-container-height: 130px;
            --user-container-height: 130px;
            --comment-controls-container-height: 35px;
            overflow-x: hidden;
            overflow-y: hidden;
        }    

        .info-container {
            padding: 5px;;
            width: 100%;
            height: 100%; 
        }

        .video-container {
            height: var(--video-container-height);
        } 
        .video-thumbnail {
            user-select: none;
            width: 160px;
            height: calc(var(--video-container-height) - 5px);
            object-fit: contain;
        }
        .video-info {
            user-select: none;
            white-space: nowrap;
            margin-left: 5px;
        }
        .video-info > .content {
            display: flex
        }
        .video-info > .content > .label {
            min-width: calc(5em + 3px);
        }
        .video-info > .content > .notice-deleted {
            font-weight: bold;
            color: red;
        }

        .user-container {
            height: var(--user-container-height);
            width: 100%;
        } 

        .controls-container {
            height: var(--comment-controls-container-height);
            display: flex;
        }
        .controls-container > label {
            height: 32px;
            user-select: none;
        }
        .controls-container .comment-checkbox:hover {
            cursor: pointer;
        }
        .controls-container input.comment-checkbox {
            height: 32px;
            vertical-align:middle;
        }
        .controls-container label.comment-checkbox {
            position: relative;
            top: 3px;
            margin-right: 10px;
        }
        .comment-state {
            user-select: none;
        }
        .comment-grid-container {
            width: 100%;
            height: calc(100% 
                - var(--video-container-height) 
                - var(--user-container-height) - var(--comment-controls-container-height));
            background-color: var(--control-color);
        }

        .icon {
            font-size: 18px;
            color: gray;
        }
        .icon:hover,
        .icon-button:hover .icon {
            color: black;
        }
        .icon[data-state="false"] {
            pointer-events: none;
            opacity: 0.3;
        }
        .icon-button {
            height: 30px;
            width: 30px;
            margin-left: 5px;
            cursor: pointer;
        }
        .move-right {
            display: flex;
            margin-left: auto;
        }
    </style>
    
    <div class="info-container">
        <div class="video-container">
            <div style="display: flex;">
                <div class="video-thumbnail" title={state.video_thumbnail_tooltip}>
                    <img src={state.video_thumbnail_url} class="video-thumbnail">
                </div>
                <div class="video-info">
                    <div class="content">
                        <div class="label">投稿日</div>: {first_retrieve}
                    </div>
                    <div class="content">
                        <div class="label">再生</div>: {view_counter.toLocaleString()}
                    </div>
                    <div class="content">
                        <div class="label">コメント</div>: {comment_counter.toLocaleString()}
                    </div>
                    <div class="content">
                        <div class="label">マイリスト</div>: {mylist_counter.toLocaleString()}
                    </div>
                    <div class="content">
                        {videoStateOnline()} {videoStateLocal()}
                    </div>
                    <div class="content">
                        {videoStateEconomy()}
                    </div>
                    <div class="content">
                        <div class="notice-deleted">{videoStateDeleted()}</div>
                    </div>
                </div>
            </div>
        </div>
        <div class="user-container">
            <player-user></player-user>
        </div>
        <div class="controls-container">
            <label class="center-v comment-checkbox" title="コメントの表示/非表示">
                <input class="center-v comment-checkbox comment-visible" type="checkbox" 
                    onclick={onclickCommentVisibleCheck} />表示
            </label>
            <div class="comment-state center-v" title="表示制限、フィルタリングしたコメント数/全コメント数">
                {state.comment_state}
            </div>
            <div class="move-right">
                <div title="設定ダイアログ表示" class="icon-button center-hv"
                    onclick={onclickShowSettingDialog}>                      
                    <span class="icon fas fa-cog"></span> 
                </div>
                <div title="動画情報更新" class="icon-button center-hv"
                    onclick={onclickUpdateThumbInfo}>
                    <span class="icon center-hv" data-state={String(enableUpdateData())}>
                        <i class="fas fa-info"></i>
                    </span>
                </div>     
                <div title="コメント更新" class="icon-button center-hv"
                    onclick={onclickUpdateComment}>
                    <span class="icon center-hv" data-state={String(enableUpdateData())}>
                        <i class="far fa-comment-dots"></i>
                    </span>
                </div>
            </div>
        </div>
        <div class="comment-grid-container">
            <div class="comment-grid"></div>
        </div>
    </div>
    
    <script>
        export default window.RiotJS.PlayerInfoPage;
    </script>
</player-info-page>