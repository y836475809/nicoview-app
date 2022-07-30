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
        export default window.RiotJS.SettingPlayerContextMenu;
    </script>
</setting-player-contextmenu>