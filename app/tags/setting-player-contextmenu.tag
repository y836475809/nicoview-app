<setting-player-contextmenu>
    <style>
    </style>

    <div class="setting-section">
        <div class="center-v title">コンテキストメニュー</div>
        <div class="setting-params">
            <div class="param-label center-v">履歴表示数</div>
            <label class="cursor-pointer" each={item in menu_num_items} >
                <input class="cursor-pointer" type="radio" name="history_num" value={item} 
                    onchange={onchangeHistoryMenuItemNum.bind(this,item)}>{item}
            </label>
            <hr>
            <div class="param-label center-v">「後で見る」表示数</div>
            <label class="cursor-pointer" each={item in menu_num_items} >
                <input class="cursor-pointer" type="radio" name="stack_num" value={item} 
                    onchange={onchangeStackMenuItemNum.bind(this,item)}>{item}
            </label>
        </div>
    </div>

    <script>
        export default {
            onBeforeMount(props) {
                this.myapi = window.myapi;
                this.menu_num_items = [5, 10, 20];
            },
            async onMounted() {
                await this.setupContextMenuSetting();
            },
            async changeParams(name, value) {
                const params = await this.myapi.ipc.Config.get("player.contextmenu", 5);
                params[name] = value;
                await this.myapi.ipc.Config.set(`player.contextmenu.${name}`, value);
            },
            setRadioValue(name, items, value) {
                const index = items.findIndex(item => item === value);
                const elms = this.root.querySelectorAll(`input[name='${name}']`);
                elms[index].checked = true;
            },
            async setupContextMenuSetting() {
                const params = await this.myapi.ipc.Config.get("player.contextmenu", {
                    history_num: 5,
                    stack_num: 5
                });
                this.setRadioValue("history_num", this.menu_num_items, params.history_num);
                this.setRadioValue("stack_num", this.menu_num_items, params.stack_num);   
            },
            async onchangeHistoryMenuItemNum(item, e) {
                await this.changeParams("history_num", parseInt(item));
            },
            async onchangeStackMenuItemNum(item, e) {
                await this.changeParams("stack_num", parseInt(item));
            }
        };
    </script>
</setting-player-contextmenu>