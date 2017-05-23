<player>
    <div id="container">
        <style scoped>
             :scope {
                position: absolute;
                width: 100%;
                background-color: #cccccc;
            }
        </style>
        <video ref="palyermain" id="player" preload='metadata' controls style="position:absolute;">
        </video>
    </div>
    <div ref="playerctr" id="player-ctr">
        <style scoped>
             :scope {
                position: absolute;
            }
        </style>
        <button id="play-btn" onclick='{ invert }'>start</button>
        <button id="stop-btn">stop</button>
        <button id="add-btn">add</button>
    </div>

    <script>
        var video_size = {}

        let getContentSize = () => {
            let w = window.innerWidth - 16
            let h = window.innerHeight - 16
            return { width: w, height: h }
        }

        let getVideoSize = () => {
            let c_size = getContentSize()
            let w_h = c_size.height
            let ctr_h = this.refs.playerctr.clientHeight

            let v_h = w_h - ctr_h
            let v_w = video_size.width / video_size.height * v_h

            if (v_w < c_size.width) {
                return { width: v_w, height: v_h }
            } else {
                let w = c_size.width
                let h = video_size.height / video_size.width * w
                return { width: w, height: h }
            }
        }

        var setPlayerContainerSize = () => {
            let h = getContentSize().height
            let w = getContentSize().width
            let player_ctr_h = this.refs.playerctr.clientHeight

            let v_size = getVideoSize()
            // console.log("v_size=", v_size)

            let player = this.refs.palyermain //document.getElementById("player")
            // play.style.left = (h - player_ctr_h)  + "px"
            let play_top = (h - player_ctr_h) / 2 - (v_size.height) / 2
            let play_left = w / 2 - (v_size.width) / 2
            //player.style.position = 'absolute';
            player.style.top = play_top + "px"
            player.style.left = play_left + "px"
        }

        var setVideoContainerSize = () => {
            let h = getContentSize().height
            let w = getContentSize().width
            let player_ctr_h = this.refs.playerctr.clientHeight

            let con = document.getElementById("container")
            con.style.height = (h - player_ctr_h) + "px"
            con.style.clip = "rect(0px " + w + "px " + (h - player_ctr_h) + "px 0px)"

            // let ctr = $('#player-ctr').get(0)
            // ctr.style.top = (h + 8 - player_ctr_h) + "px"
            this.refs.playerctr.style.position = 'absolute';
            //this.refs.playerctr.style.top = (h + 8 - player_ctr_h) + "px"
            this.refs.playerctr.style.top = (h - player_ctr_h) + "px"
        }

        invert = () => {
            console.log('invert')
            let video = this.refs.palyermain
            video.src = "mov/test.mp4"
            // video.src = "mov/oc.mp4"
            video.type = "video/mp4"
            video.load();
        }

        this.on('mount', function () {
            console.log('mount')

            this.refs.palyermain.addEventListener('loadedmetadata', (event) => {
                let w = event.target.videoWidth
                let h = event.target.videoHeight

                video_size = { width: w, height: h }

                setPlayerContainerSize()

                const v_size = getVideoSize()
                this.refs.palyermain.style.width = v_size.width + "px"
                this.refs.palyermain.style.height = v_size.height + "px"
            });


            setVideoContainerSize()

            let ff = () => {
                // let nn = getVideoSize();
                console.log('resizeend ')

                // let h = window.innerHeight - 16
                // this.refs.palyermain.style.height = (h) + "px"
                setVideoContainerSize()
                setPlayerContainerSize()

                const v_size = getVideoSize()
                this.refs.palyermain.style.width = v_size.width + "px"
                this.refs.palyermain.style.height = v_size.height + "px"
            }

            obs.on("resizeEndEvent", function (wsize) {
                ff()
            })

            // const timeout = 200
            // let timer
            // window.addEventListener('resize', () => {
            //     clearTimeout(timer);
            //     timer = setTimeout(() => {
            //         ff()
            //     }, timeout);
            // })
        })
    </script>

</player>