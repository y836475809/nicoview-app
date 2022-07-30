<player-page>
    <style>
        :host {
            --tags-height: 60px;
            --controls-height: 50px;
            background-color: var(--control-color);
        }
        .player-container {
            margin: 0;
            width: 100%;
            height: 100%;
        }
        .tags-container {
            height: var(--tags-height);
            outline: none;
        }  
        .video-container {
            height: calc(100% - var(--tags-height) - var(--controls-height));
            background-color: black;
            outline: none;
            position: relative;
        }  
        .controls-container {
            height: var(--controls-height);
            outline: none;
        }  
        .video-container > div {
            width: 100%;
            height: 100%;
            overflow: hidden; 
            object-fit: contain;
            object-position: center center;
        }
    </style>

    <div class="player-container">
        <div class="center-hv tags-container" tabIndex="-1" onkeyup={onkeyupTogglePlay}>
            <player-tags></player-tags>
        </div>
        <div class="video-container" tabIndex="-1" 
            onkeyup={onkeyupTogglePlay}
            onmouseup={oncontextmenu}>
            <div>
                <player-video></player-video>
            </div>
            <open-video-form obs={obs_open_video_form}></open-video-form>
        </div>
        <div class="center-hv controls-container" tabIndex="-1" onkeyup={onkeyupTogglePlay}>
            <player-controls></player-controls>
        </div>
    </div>

    <script>
        export default window.RiotJS.PlayerPage;
    </script>    
</player-page>