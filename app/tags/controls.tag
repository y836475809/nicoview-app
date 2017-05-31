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
        <!--<button id="play-btn" onclick='{ invert }'>start</button>-->
        <button id="play-btn" onclick="{ send_data_f }">start</button>
        <button id="stop-btn">stop</button>
        <button id="add-btn" onclick='{ add }'>add</button>
    </div>
    <script>
        let commnets = [
            { no: 0, vpos: 0, date: 1000, user_id: "aaa", text: "aaa" },
            { no: 1, vpos: 500, date: 1000, user_id: "aaa", text: "aaa" },
            { no: 2, vpos: 1000, date: 1000, user_id: "aaa", text: "aaa" },
            { no: 3, vpos: 1500, date: 1000, user_id: "aaa", text: "aaa" },
            { no: 4, vpos: 2000, date: 1000, user_id: "aaa", text: "aaa" },
        ]

        send_data_f(e){
            obs.trigger("receivedData",
                { src: "mov/test.mp4", type: "video/mp4" , commnets:commnets})
        }
    </script>
</controls>