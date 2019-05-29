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
        <i class="close-button fas fa-times" onclick={this.onclickClose}></i>
        <div class="tab-area">
            <label onclick="{this.onclickSelect.bind(this,0)}">NG設定</label>
            <label onclick="{this.onclickSelect.bind(this,1)}">tab2</label>
            <label onclick="{this.onclickSelect.bind(this,2)}">tab3</label>
        </div>
        <div class="panel-area">
            <div class="tab-panel">
                <comment-ng-setting></comment-ng-setting>
            </div>
            <div class="tab-panel">
                <p>panel2</p>
            </div>
            <div class="tab-panel">
                <p>panel3</p>
            </div>
        </div>
    </dialog>

    <script>
        /* globals app_base_dir obs */
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

        const setup = () => {
            const panel_area = this.root.querySelector(".panel-area");
            Array.from(this.root.querySelectorAll(".panel-area > .tab-panel"), 
                (elm) => {
                    elm.style.width = panel_area.clientWidth + "px";
                    elm.style.height = panel_area.clientHeight + "px"; 
                });

            selectTab(0);
        };

        this.onclickSelect = (index, e)=>{
            selectTab(index);
        };

        this.onclickClose = (e) => {
            const dialog = this.root.querySelector("dialog");
            dialog.close();
        };

        obs.on("comment-setting-dialog:show", (args) => {
            const dialog = this.root.querySelector("dialog");
            dialog.showModal();

            setup();

            const ng_items = args;
            obs.trigger("comment-ng-setting:ng-items", ng_items);
        });
    </script>
</comment-setting-dialog>