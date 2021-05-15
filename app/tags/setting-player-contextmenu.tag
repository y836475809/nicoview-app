<setting-player-contextmenu>
    <style scoped>
    </style>

    <div class="setting-section">
        <div class="center-v title">コンテキストメニュー</div>
        <div class="setting-params">
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
        const myapi = window.myapi;

        this.menu_num_items = [5, 10, 20];

        const changeParams = async (name, value) => {
            const params = await myapi.ipc.Config.get("player.contextmenu", 5);
            params[name] = value;
            await myapi.ipc.Config.set(`player.contextmenu.${name}`, value);
        };

        const setRadioValue = (name, items, value) => {
            const index = items.findIndex(item => item === value);
            const elms = this.root.querySelectorAll(`input[name='${name}']`);
            elms[index].checked = true;
        };

        const setupContextMenuSetting = async () => {
            const params = await myapi.ipc.Config.get("player.contextmenu", {
                history_num: 5,
                stack_num: 5
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