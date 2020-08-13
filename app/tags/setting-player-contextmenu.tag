<setting-player-contextmenu>
    <style scoped>
    </style>

    <div class="setting-section">
        <div class="setting-params">
            <div class="title">コンテキストメニュー</div>
            <hr>
            <div class="param-label center-v">履歴表示数</div>
            <label each={item in menu_num_items} >
                <input type="radio" name="history_num" value={item} 
                    onchange={onchangeHistoryMenuItemNum.bind(this,item)}>{item}
            </label>
            <hr>
            <div class="param-label center-v">「後で見る」表示数</div>
            <label each={item in menu_num_items} >
                <input type="radio" name="stack_num" value={item} 
                    onchange={onchangeStackMenuItemNum.bind(this,item)}>{item}
            </label>
        </div>
    </div>

    <script>
        const ipc = window.electron.ipcRenderer;

        this.menu_num_items = [5, 10, 20];

        const changeParams = async (name, value) => {
            const params = await ipc.invoke("config:get", { key: "player.contextmenu", value: 5 });
            params[name] = value;
            await ipc.invoke("config:set", { key: `player.contextmenu.${name}`, value: value });
        };

        const setRadioValue = (name, items, value) => {
            const index = items.findIndex(item => item === value);
            const elms = this.root.querySelectorAll(`input[name='${name}']`);
            elms[index].checked = true;
        };

        const setupContextMenuSetting = async () => {
            const params = await ipc.invoke("config:get", 
                { 
                    key:"player.contextmenu", 
                    value:{
                        history_num:5,
                        stack_num:5
                    } 
                });
            setRadioValue("history_num", this.menu_num_items, params.history_num);
            setRadioValue("stack_num", this.menu_num_items, params.stack_num);   
        };

        this.onchangeHistoryMenuItemNum = async (item, e) => {
            await changeParams("history_num", parseInt(item));
        };
        this.onchangeStackMenuItemNum = async (item, e) => {
            await changeParams("stack_num", parseInt(item));
        };

        this.on("mount", async () => {
            await setupContextMenuSetting();
        });
    </script>
</setting-player-contextmenu>