<comment-setting-dialog>
    <style scoped>
        dialog {
            border: solid 1px #aaa;
            border-radius: 5px;
            width: 500px;
            height: 400px;
        }

        dialog::backdrop {
            opacity: 0;
        }

        .close-button {
            font-size: 15px;
            float: right;
        }
        .close-button:hover {
            cursor: pointer;
            background-color: lightgray; 
        }

        .tab-area {
            width: 100%;
            height: 30px;
            top: 20px;
            position: relative;
        }

        .tab-area > label {
            width: 100px;
            height: 30px;
            color: #999;
            background:#fff;
            display: table-cell;
            font-size: 15px;
            text-align: center;   
            vertical-align: middle;
            cursor: pointer;
            user-select: none;
        }

        .tab-area > label:hover {
            opacity: 0.5;
        }

        .tab-area > label.active {
            border-bottom: 4px solid var(--control-border-color);
            color: #000;
        }

        .panel-area {
            width: 100%;
            height: calc(100% - 50px);
            top: 60px;
            background: #fff;
        }

        .tab-panel {
            position: absolute;
            top: 65px;
            background-color: var(--control-color);
        }

        .tab-panel.active {
            display: block;
        }
    </style>

    <dialog class="dialog-shadow">
        <i class="close-button fas fa-times" onclick={onclickClose}></i>
        <div class="tab-area">
            <label onclick="{onclickSelect.bind(this,0)}">NG設定</label>
            <label onclick="{onclickSelect.bind(this,1)}">コメント表示</label>
            <label onclick="{onclickSelect.bind(this,2)}">tab3</label>
        </div>
        <div class="panel-area">
            <div class="tab-panel">
                <comment-ng-setting obs={opts.obs}></comment-ng-setting>
            </div>
            <div class="tab-panel">
                <comment-display-setting obs={opts.obs}></comment-display-setting>
            </div>
            <div class="tab-panel">
                <p>panel3</p>
            </div>
        </div>
    </dialog>

    <script>
        const obs_dialog = this.opts.obs;

        const tab_map = new Map([
            ["comment-ng", 0],
            ["comment-display", 1]
        ]);

        const selectTab = (selected_index) => {
            Array.from(this.root.querySelectorAll(".tab-area > label"), 
                (elm, index) => {
                    if(index===selected_index){
                        if(!elm.classList.contains("active")){
                            elm.classList.add("active");
                        }
                    }else{
                        elm.classList.remove("active");
                    }
                });
           
            Array.from(this.root.querySelectorAll(".panel-area > .tab-panel"), 
                (elm, index) => {
                    if(index===selected_index){
                        elm.style.zIndex = 1;
                    }else{
                        elm.style.zIndex = 0;
                    } 
                });
        };

        const setup = (selected_tab) => {
            const panel_area = this.root.querySelector(".panel-area");
            Array.from(this.root.querySelectorAll(".panel-area > .tab-panel"), 
                (elm) => {
                    elm.style.width = panel_area.clientWidth + "px";
                    elm.style.height = panel_area.clientHeight + "px"; 
                });

            selectTab(tab_map.get(selected_tab));
        };

        this.onclickSelect = (index, e)=>{
            selectTab(index);
        };

        this.onclickClose = (e) => {
            const dialog = this.root.querySelector("dialog");
            dialog.close();
        };

        obs_dialog.on("comment-setting-dialog:show", (args) => {
            const { ng_items, selected_tab } = args;

            const dialog = this.root.querySelector("dialog");
            dialog.showModal();

            setup(selected_tab);

            obs_dialog.trigger("comment-ng-setting:ng-items", ng_items);
        });
    </script>
</comment-setting-dialog>