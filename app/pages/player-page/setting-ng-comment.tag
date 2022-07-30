<setting-ng-comment>
    <style>
        :host {
            --control-height: 25px;
            --margin: 5px
        }

        .setting-params {
            width: 100%;
            height: 300px;
        }

        .comment-ng-grid-container {
            width: 100%;
            height: calc(100% - var(--control-height) - var(--margin));
            background-color: white;
        }

        .delete-button {
            float: right;
            width: 60px;
            height: var(--control-height);
            border-radius: 2px;
            text-align: center;
            color: black;
            user-select: none;
            border-style: none;
            border: 1px solid var(--control-border-color);
            margin-top: 5px;
        }

        .delete-button:active {
            background-color: var(--control-color);
        }

        .delete-button:hover {
            cursor: pointer;
        }
    </style>

    <div class="setting-section"> 
        <div class="center-v title">NGコメント</div>
        <div class="setting-params">     
            <div class="comment-ng-grid-container">
                <div class="comment-ng-grid"></div>
            </div>
            <button type="button" class="delete-button" title="選択された項目を削除" 
                onclick={onclickDelete}>削除</button>
        </div>
    </div>

    <script>
        export default window.RiotJS.SettingNGComment;
    </script>
</setting-ng-comment>