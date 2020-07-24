<player-setting-dialog>
    <style scoped>
        :scope {
            --title-height: 25px;
        }

        dialog {
            border: solid 1px #aaa;
            border-radius: 5px;
            min-width: 400px;
            min-height: 300px;
            width: 50vw;
            height: 80vh;
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
    </style>

    <dialog class="dialog-shadow">
        <i class="close-button fas fa-times" title="閉じる" onclick={onclickClose}></i>
        <div class="setting-container">
            <setting-ng-comment obs={opts.obs}></setting-ng-comment>
            <setting-display-comment obs={opts.obs}></setting-display-comment>
            <setting-player-contextmenu></setting-player-contextmenu>
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