<player-main-page onmousemove={mousemove} onmouseup={mouseup}>
    <style>
        :host {
            display: flex;
            height: 100%;
            --right-width: 300px;
            overflow: hidden;
        }
    
        .gutter {
            cursor: col-resize;
            width: 4px;
            border-left: 1px solid var(--control-border-color);
        }
    
        .split.left{
            margin: 0;
            width: calc(100% - var(--right-width));
        }

        .split.right{
            margin: 0;
            width: var(--right-width);
            height: 100%;
        }
    </style>

    <div class="player-frame split left">
        <player-page></player-page>
    </div>
    <div class="gutter" onmousedown={mousedown}></div>
    <div class="info-frame split right">
        <player-info-page></player-info-page>
    </div>

    <player-setting-dialog></player-setting-dialog>

    <script>
        export default window.RiotJS.PlayerMainPage;
    </script>
</player-main-page>