<player-setting-dialog>
    <style scoped>
        dialog {
            border: solid 1px #aaa;
            border-radius: 5px;
            width: 500px;
            height: 400px;
            padding-bottom: 2em;
        }

        dialog::backdrop {
            opacity: 0;
        }

        .close-button {
            margin-right: 4px;
            margin-bottom: 10px;
            font-size: 15px;
            float: right;
            color: gray;
            cursor: pointer;
        }
        .close-button:hover {
            color: black;
        }

        .setting-container {
            width: 100%;
            height: calc(100% - 5px);
            overflow: auto;
        }
        .setting-container > .section {
            width: calc(100% - 5px);
            padding-bottom: 1em;
        }
        .setting-container > .section > .title {
            user-select: none;
            font-size: 1.2em;
        }
        .setting-container > .section > .setting {
            background-color: var(--control-color);
        }

        .setting.ng-comment {
            height: 300px;
            padding: 10px;
        }
        .setting.display-comment {
            height: 200px;
            padding: 10px;
        }
        .setting.contextmenu {
            height: 150px;
            padding: 10px;
        }
    </style>

    <dialog class="dialog-shadow">
        <i class="close-button fas fa-times" title="閉じる" onclick={onclickClose}></i>
        <div class="setting-container">
            <div class="section">
                <div class="title">NGコメント</div>
                <div class="setting ng-comment">
                    <setting-ng-comment obs={opts.obs}></setting-ng-comment>
                </div>
            </div>
            <div class="section">
                <div class="title">コメント表示</div>
                <div class="setting display-comment">
                    <setting-display-comment obs={opts.obs}></setting-display-comment>
                </div>
            </div>
            <div class="section">
                <div class="title">コンテキストメニュー</div>
                <div class="setting contextmenu">
                    <setting-player-contextmenu></setting-player-contextmenu>
                </div>
            </div>
        </div>
    </dialog>

    <script>
        const obs_dialog = this.opts.obs;

        this.onclickClose = (e) => {
            const dialog = this.root.querySelector("dialog");
            dialog.close();
        };

        obs_dialog.on("player-setting-dialog:show", (args) => {
            const { ng_items } = args;

            const dialog = this.root.querySelector("dialog");
            dialog.showModal();

            obs_dialog.trigger("setting-ng-comment:ng-items", ng_items);
        });
    </script>
</player-setting-dialog>