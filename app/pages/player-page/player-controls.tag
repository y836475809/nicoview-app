<player-controls>
    <style>
        :host{
            display:grid;
            grid-template-columns: 50px 1fr 100px 50px;
            grid-template-areas: "area1 area2 area3 area4";
            width: 100%;
            height: 100%;
            padding: 2px;
        }
        .play-btn{
            grid-area: area1;
        }
        .play-btn > button{
            margin-left: 5px;
            width: 30px;
            height: 30px;
            cursor: pointer;
        }
        .play-btn > button > span{
            color: gray;           
        }
        .seek{
            grid-area: area2;
        }
        .volume{
            grid-area: area3;
            margin-left: 10px;
            margin-right: 5px;
        }   
        .toggle-info{
            grid-area: area4;
            margin-left: auto;
            margin-right: 10px;
        } 
        .toggle-info > span {
            font-size: 18px;
            color: gray;
            cursor: pointer;
        }
        .toggle-info > span:hover {
            color: black;
        }
        
        player-seek > .slider, 
        player-volume > .slider {
            cursor: pointer;
        }

        .move-start {
            font-size: 12px;
            color: gray;
            cursor: pointer;
            margin-right: 10px;
        }
        .move-start:hover {
            color: black;
        }
    </style>

    <div class="center-v play-btn">
        <button disabled={state.play_disabled} onclick={play}>
            <span class={state.button_class}></span>
        </button>
    </div>
    <div class="center-v seek">
        <div class="move-start" title="最初に移動" onclick={moveStart}>
            <i class="fas fa-circle"></i>
        </div>
        <player-seek></player-seek>
    </div>
    <div class="center-v volume">
        <player-volume></player-volume>
    </div>
    <div class="center-v toggle-info" title="動画情報の表示/非表示">
        <span class="fas fa-info" onclick={toggleInfoview}></span>
    </div>
    <script>
        export default window.RiotJS.PlayerControls;
    </script>
</player-controls>