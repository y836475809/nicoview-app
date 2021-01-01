<player-setting-dialog>
    <style scoped>
        :scope {
            --title-height: 25px;
            --setting-tab-height: 25px;
            --setting-content-top: 65px;
            --setting-dialog-height: 60vh;
        }

        dialog {
            border: solid 1px #aaa;
            border-radius: 5px;
            min-width: 400px;
            min-height: 300px;
            width: 50vw;
            height: var(--setting-dialog-height);
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

        .setting-section {
            width: calc(100% - 5px);
            padding-bottom: 1em;
            
        }
        .setting-section .title {
            height: var(--title-height);
            user-select: none;
            font-size: 1.2em;
        }
        .setting-section .setting-params {
            background-color: var(--control-color);
            padding: 5px;
        }
        .setting-section .param-label {
            font-size: 1.2em;
            height: 30px;
        }

        .setting-container input[type='checkbox']:hover,
        .setting-container input[type='radio']:hover {
            cursor: pointer;
        }
        .setting-container input[type='checkbox'],
        .setting-container input[type='radio'] {
            position: relative;
            top: 2px;
            margin-left: 15px;
        }  

        .setting-container input[name="player-setting-tab"] {
            display: none;
            margin-left: 5px;      
        }
        .setting-container input[name="player-setting-tab"]:checked + .tab_class {
            border-bottom: 2px solid royalblue;
        }
        .setting-container input[name="player-setting-tab"]:checked + .tab_class + .content_class {       
            width: calc(100% - 10px * 2);
            z-index: 1;
        }
        .setting-container .tab_class {
            position: relative;
            top: 3px;
            height: var(--setting-tab-height);
            margin-right: 10px;
        }
        .setting-container .tab_class:hover {
            cursor: pointer;
        }
        .setting-container .content_class {
            z-index: -1;
            position: absolute;
            margin-top: 5px;
            top: var(--setting-content-top);
            width: calc(100% - 20px * 2);
            height: calc(var(--setting-dialog-height) - (var(--setting-content-top) + var(--setting-tab-height)));
            overflow: auto;
            background-color: white;
        }
    </style>

    <dialog class="dialog-shadow">
        <i class="close-button fas fa-times" title="閉じる" onclick={onclickClose}></i>
        <div class="setting-container" style="display: flex;">
            <input type="radio" name="player-setting-tab" id="player-setting1" checked>
            <label class="tab_class title" for="player-setting1">NGコメント</label>
            <div class="content_class">
                <setting-ng-comment obs={opts.obs}></setting-ng-comment>
            </div>
            
            <input type="radio" name="player-setting-tab" id="player-setting2">
            <label class="tab_class title" for="player-setting2">コメント表示</label>
            <div class="content_class">
                <setting-display-comment obs={opts.obs}></setting-display-comment>
            </div>

            <input type="radio" name="player-setting-tab" id="player-setting3">
            <label class="tab_class title" for="player-setting3">コンテキストメニュー</label>
            <div class="content_class">
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