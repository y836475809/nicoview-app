<player>
    <header>test</header>
    <div id="container">
        <!--<style scoped>
             :scope {
                /*position: absolute;*/
                width: 100%;
                background-color: #cccccc;
                padding-top: 10px;
                margin-top: 50px;
                height: auto;
                padding-bottom: 10px;
                margin-bottom: 80px;
            }
        </style>-->
        <video ref="palyermain" id="player" preload='metadata' controls style="position:absolute;">
        </video>
    </div>
    <div ref="playerctr" id="player-ctr">
        <!--<style scoped>
             :scope {
                /*position: absolute;*/
                position: fixed;
                background-color: #cccccc;
                bottom: 0;
                left: 0;
                z-index: 10;
                width: 100%;
                height: 80px;
            }
        </style>-->
        <button id="play-btn" onclick='{ invert }'>start</button>
        <button id="stop-btn">stop</button>
        <button id="add-btn" onclick='{ add }'>add</button>
    </div>

    <script>
        var create_comment_elm = require('../../comment')

        invert = () => {
            console.log('invert')
            let video = this.refs.palyermain
            video.src = "mov/test.mp4"
            // video.src = "mov/oc.mp4"
            video.type = "video/mp4"
            video.load();
        }

        add = () => {
            const top = 50
            const duration = 5000
            let w = getContentSize().width
            let params = create_comment_elm("container", "message", w, duration)
            let sp = params.sp
            let ele = params.ele
            // document.getElementById("container").appendChild(ele);
            // let rect = ele.getBoundingClientRect()
            ele.style.position = "absolute"
            ele.style.top = top + "px"
            // const duration = 5000
            // let param = set_comment(ele, "container", top, w, duration)

            // console.log(rect)
            let params2 = create_comment_elm("container", "message", w, duration)
            let ele2 = params2.ele
            // document.getElementById("container").appendChild(ele);
            // let rect = ele.getBoundingClientRect()
            ele2.style.position = "absolute"
            ele2.style.top = top * 2 + "px"
            // const duration = 5000
            // let param = set_comment(ele, "container", top, w, duration)

            var comment_anime = anime({
                targets: '.comment',
                translateX: function (el) {
                    return el.getAttribute('data-x')
                },
                // translateY: function (el, i) {
                //     // return (30 * i);
                //     return 50;
                // },
                duration: function (target) {
                    return target.getAttribute('data-duration')
                },
                delay: function (target, index) {
                    // console.log(index)
                    return index * 1000
                },
                easing: 'linear',
                loop: false,
                autoplay: false
            });

            comment_anime.play()
        }

        var video_size = {}

        let getContentSize = () => {
            let w = window.innerWidth //- 16
            let h = window.innerHeight - 60 - 16
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
            let player_ctr_h = this.refs.playerctr.clientHeight //-60

            let v_size = getVideoSize()
            // console.log("v_size=", v_size)

            let player = this.refs.palyermain //document.getElementById("player")
            // play.style.left = (h - player_ctr_h)  + "px"
            let play_top = (h - player_ctr_h) / 2 - (v_size.height) / 2 + 60
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
            //  con.style.position = "absolute"
            con.style.height = (h - player_ctr_h) + "px"
            con.style.clip = "rect(0px " + w + "px " + (h - player_ctr_h) + "px 0px)"
console.log("con.style=", con.style)
            // let ctr = $('#player-ctr').get(0)
            // ctr.style.top = (h + 8 - player_ctr_h) + "px"
            // this.refs.playerctr.style.position = 'absolute';
            //this.refs.playerctr.style.top = (h + 8 - player_ctr_h) + "px"
            // this.refs.playerctr.style.top = (h - player_ctr_h) + "px"
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