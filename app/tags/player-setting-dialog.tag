<player-setting-dialog>
    <style scoped>
        :scope {
            --title-height: 25px;
            --setting-tab-height: 25px;
            --setting-content-top: 65px;
            --setting-dialog-height: 60vh;
        }

        dialog.player-setting {
            border: solid 1px #aaa;
            border-radius: 5px;
            min-width: 400px;
            min-height: 300px;
            width: 50vw;
            height: var(--setting-dialog-height);
            overflow:hidden;
        }

        .player-setting > .close-button-container {
            height: 25px;
            width: 100%;
        }
        .player-setting > .close-button-container > .close-button {
            margin-right: 4px;
            margin-bottom: 10px;
            font-size: 15px;
            float: right;
            color: gray;
            cursor: pointer;
        }
        .player-setting > .close-button-container > .close-button:hover {
            color: black;
        }

        .player-setting > .settings-container {
            overflow: scroll;
            height: calc(var(--setting-dialog-height) - 25px);
        }
        .settings-container > .setting-container {
            margin: 0 10px 10px 10px;
            background-color: white;
            border-radius: 3px;
            border: 1px solid darkgray;
        }
        .setting-container .title {
            height: 30px;
            width: 100%;
            border-radius: 3px 3px 0 0;
            padding: 0 10px 0 10px;
            vertical-align: middle;
            background-color: lightblue;
            user-select: none;
        }

        .setting-container .setting-section .title {
            height: var(--title-height);
            user-select: none;
            font-size: 1.2em;
        }
        .settings-container .setting-section .setting-params {
            background-color: var(--control-color);
            padding: 5px;
        }
        .settings-container .setting-section .param-label {
            font-size: 1.2em;
            height: 30px;
            user-select: none;
        }

        .settings-container input[type="radio"]:hover,
        .settings-container input[type="checkbox"]:hover,
        .settings-container .cursor-pointer:hover {
            cursor: pointer;
        }
    </style>

    <dialog class="player-setting dialog-shadow">
        <div class="close-button-container">
            <i class="close-button fas fa-times" title="閉じる" onclick={onclickClose}></i>
        </div>
        <div class="settings-container">
            <div class="setting-container">
                <setting-ng-comment obs={opts.obs}></setting-ng-comment>
            </div>
            <div class="setting-container">
                <setting-display-comment obs={opts.obs}></setting-display-comment>
            </div>
            <div class="setting-container">
                <setting-player-contextmenu></setting-player-contextmenu>
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