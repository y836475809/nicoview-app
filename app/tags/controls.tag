<controls>
    <style scoped>
         :scope #player-ctr {
            background-color: #cccccc;
            position: fixed;
            bottom: 0;
            left: 0;
            z-index: 10;
            width: 100%;
            height: 80px;
        }
    </style>
    <div ref="playerctr" id="player-ctr">
        <button id="play-btn" onclick='{ invert }'>start</button>
        <button id="stop-btn">stop</button>
        <button id="add-btn" onclick='{ add }'>add</button>
    </div>
</controls>