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
        const myapi = window.myapi;

        const changeParams = async(name, value) => {
            const params = await myapi.ipc.Config.get("player.contextmenu", 5);
            params[name] = value;
            await myapi.ipc.Config.set(`player.contextmenu.${name}`, value);
        };
        const setRadioValue = (tag, name, items, value) => {
            const index = items.findIndex(item => item === value);
            const elms = tag.$$(`input[name='${name}']`);
            elms[index].checked = true;
        };

        export default {
            menu_num_items:[5, 10, 20],
            onBeforeMount(props) { // eslint-disable-line no-unused-vars
            },
            async onMounted() {
                const params = await myapi.ipc.Config.get("player.contextmenu", {
                    history_num: 5,
                    stack_num: 5
                });
                setRadioValue(this, "history_num", this.menu_num_items, params.history_num);
                setRadioValue(this, "stack_num", this.menu_num_items, params.stack_num);
            },
            async onchangeHistoryMenuItemNum(item, e) { // eslint-disable-line no-unused-vars
                await changeParams("history_num", parseInt(item));
            },
            async onchangeStackMenuItemNum(item, e) { // eslint-disable-line no-unused-vars
                await changeParams("stack_num", parseInt(item));
            }
        };
    </script>
</setting-player-contextmenu>