<player-seek>
    <style>
        :host {
            --seek-height: 50px;
            display:grid;
            grid-template-columns: 1fr 50px 10px 40px;
            grid-template-areas: "seek current slash duration";
            width: 100%;
            height: var(--seek-height);
            margin: 0;
            font-family: "Meiryo";
            user-select: none;
        } 

        .seek-container {
            grid-area: seek;
            position: relative;
            height: calc(var(--seek-height) - 20px);
            top: 50%;
            transform: translateY(-50%); 
            cursor: pointer;
        } 
        .seek-bar {
            position: relative;
            height: 10px;
            top: 50%;
            transform: translateY(-50%);
            background-color: lightgray;
        }
        .seek-value {
            margin-top: -10px;
            height: 100%;
            background-color: #797b80;
        }
        .buffered-value {
            height: 100%;
            width: 0;
            background-color: royalblue;
        }

        .seek-timer {
            text-align: center;
            line-height: var(--seek-height);
            font-size: 12px;
        }
        .current {
            grid-area: current;
            margin-left: 10px;
        }
        .slash {
            grid-area: slash;
        }  
        .duration {
            grid-area: duration;
        }

        .seek-tooltip {
            position:absolute;
            height: 30px;
            width: 50px;
            color: black;
            background-color: white;
            border: 1px solid darkgray;
            border-radius: 2px;
            display: none;
        }
        .seek-tooltip > .text {
            height: 100%;
        }
        .seek-container:hover + .seek-tooltip {
            display: block;
        }
    </style>

    <div class="seek-container" onmousedown={mousedown} onmousemove={mouseOver}>
        <div class="seek-bar">  
            <div class="buffered-value"></div>
            <div class="seek-value"></div>
        </div>
    </div>
    <div class="seek-tooltip"><div class="center-hv text"></div></div>
    <div class="seek-timer current">{state.fmt_current}</div>
    <div class="seek-timer slash">/</div>
    <div class="seek-timer duration">{state.fmt_duration}</div>
    
    <script>
        export default window.RiotJS.PlayerSeek;
    </script>
</player-seek>