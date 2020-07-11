<setting-player-contextmenu>
    <style scoped>
        .param-label {
            font-size: 1.2em;
            height: 30px;
        }
        .param-space {
            height: 10px;
        }
    </style>

    <div class="param-label center-v">履歴の表示数</div>
    <div>
        <label each={item in menu_num_items} >
            <input type="radio" name="history_num" value={item} 
                onchange={onchangeHistoryMenuItemNum.bind(this,item)}>{item}
        </label>
    </div>
    <div class="param-space"></div>
    <div class="param-label center-v">「後で見る」の表示数</div>
    <div>
        <label each={item in menu_num_items} >
            <input type="radio" name="stack_num" value={item} 
                onchange={onchangeStackMenuItemNum.bind(this,item)}>{item}
        </label>
    </div>

    <script>
        const { IPCClient } = window.IPC;

        this.menu_num_items = [5, 10, 20];

        const changeParams = async (name, value) => {
            const params = await IPCClient.request("config", "get", { key: "player.contextmenu", value: 5 });
            params[name] = value;
            await IPCClient.request("config", "set", { key: `player.contextmenu.${name}`, value: value });
        };

        const setRadioValue = (name, items, value) => {
            const index = items.findIndex(item => item === value);
            const elms = this.root.querySelectorAll(`input[name='${name}']`);
            elms[index].checked = true;
        };

        const setupContextMenuSetting = async () => {
            const params = await IPCClient.request("config", "get", 
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