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
        <button id="play-btn" onclick='{ play }'>start</button>
        <button id="stop-btn">stop</button>
        <button id="add-btn" onclick='{ add }'>add</button>
        <seek></seek>
    </div>
    <script>
        require('./seek.tag')
        riot.mount('seek');
        // this.on('mount', () => {
        //     $("#slider").slider();
        // })

        play = () => {
            obs.trigger("play")
        }
        add = () => { }
    </script>
</controls>