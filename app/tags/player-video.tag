<player-video>
    <style scoped>
         :scope header {
            position: fixed;
            top: 0;
            left: 0;
            z-index: 10;
            width: calc(100% - 4px);
            height: 50px;
            border: 2px solid black;
        }

         :scope #palyer-container {
            background-color: #ccc000;
            position: absolute;
            top: 50px;
            bottom: 300px;
            width: 100%;
            height: calc(100% - 50px - 80px);
        }
        /*:scope #player-ctr {
            background-color: #cccccc;
            position: fixed;
            bottom: 0;
            left: 0;
            z-index: 10;
            width: 100%;
            height: 80px;
        }*/
    </style>
    <!-- <header>test</header> -->
    <div ref="palyercontainer" id="palyer-container">
        <video ref="palyermain" id="player" autoplay preload='metadata' controls style="position:absolute;">
        </video>
    </div>
    <!--<div ref="playerctr" id="player-ctr">
        <button id="play-btn" onclick='{ invert }'>start</button>
        <button id="stop-btn">stop</button>
        <button id="add-btn" onclick='{ add }'>add</button>
    </div>-->

    <script>
        var $ = jQuery = require("jquery")
        let comment_anime = null
        let my = []
        // var create_comment_elm = require('../../comment')
        let comment_elm = require('../../comment')
        let nico_comment = require('../../nico_comment')

        obs.on("receivedData", (data) => {
            if(comment_anime!==null){
                anime.remove('.comment');
                $('.comment').remove();
            }

            console.log('data=', data)

            let video = this.refs.palyermain
            video.src = data.src
            video.type = data.type
            video.load()

            let nc_elms = []
            let nc_params = []
            const parent_id = "palyer-container"
            const width = getContentSize().width
            const duration = 5000
            let commnets = data.commnets
            let cm_elm = new comment_elm(parent_id, width, duration)
            commnets.forEach((cm) => {
                const no = cm.no
                const text = cm.text
                const delay = cm.vpos
                ret = cm_elm.cretae_flow(no, text, delay)
                nc_elms.push(ret.ele)
                nc_params.push(ret.params)

            });

            const num = 3
            // const c_top = this.refs.palyercontainer.offsetTop
            let cm = new nico_comment(num)
            cm.width = width
            cm.comments = nc_params
            cm.calc_comment()

            let lanes_map
            let calc_cms = cm.comments
            calc_cms.forEach((cm, index) => {
                // lanes_map[cm.no] = cm.lane_index
                let em = nc_elms[index]
                em.style.position = "absolute"
                em.style.top = (cm.lane_index * 50) + "px"
            });


            comment_anime = anime({
                targets: '.comment',
                translateX: function (el) {
                    return el.getAttribute('data-x')
                },
                duration: function (target) {
                    return duration
                },
                delay: function (target, index) {
                    return target.getAttribute('data-delay')
                },
                easing: 'linear',
                loop: false,
                autoplay: false
            });
        })

        invert = () => {
            console.log('invert')
            let video = this.refs.palyermain
            video.src = "mov/test.mp4"
            // video.src = "mov/oc.mp4"
            video.type = "video/mp4"
            video.load();
        }

        add = () => {
            comment_anime.play()

            // const parent_id = "container"
            // const top = 50
            // const duration = 5000
            // let w = getContentSize().width

            // let params = create_comment_elm(parent_id, "message", w, duration)
            // let sp = params.sp
            // let ele = params.ele
            // ele.style.position = "absolute"
            // ele.style.top = top + "px"

            // let params2 = create_comment_elm(parent_id, "message", w, duration)
            // let ele2 = params2.ele
            // ele2.style.position = "absolute"
            // ele2.style.top = top * 2 + "px"

            // var comment_anime = anime({
            //     targets: '.comment',
            //     translateX: function (el) {
            //         return el.getAttribute('data-x')
            //     },
            //     duration: function (target) {
            //         return target.getAttribute('data-duration')
            //     },
            //     delay: function (target, index) {
            //         return index * 1000
            //     },
            //     easing: 'linear',
            //     loop: false,
            //     autoplay: false
            // });

            // comment_anime.play()
        }

        var video_size = {}
// 
        let getContentSize = () => {
            let con = this.refs.palyercontainer
            let w = con.clientWidth
            let h = con.clientHeight
            return { width: w, height: h }
        }

        let getVideoSize = () => {
            let c_size = getContentSize()
            let w_h = c_size.height
            let ctr_h = 0 //this.refs.playerctr.clientHeight

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
            let player_ctr_h = 0//this.refs.playerctr.clientHeight //-60

            let v_size = getVideoSize()

            let player = this.refs.palyermain //document.getElementById("player")
            let play_top = (h - player_ctr_h) / 2 - (v_size.height) / 2 + 0
            let play_left = w / 2 - (v_size.width) / 2
            player.style.top = play_top + "px"
            player.style.left = play_left + "px"
        }

        this.on('mount', function () {
            console.log('mount')
            let self = this
            this.refs.palyermain.addEventListener('loadedmetadata', (event) => {
                let w = event.target.videoWidth
                let h = event.target.videoHeight

                video_size = { width: w, height: h }

                setPlayerContainerSize()

                const v_size = getVideoSize()
                this.refs.palyermain.style.width = v_size.width + "px"
                this.refs.palyermain.style.height = v_size.height + "px"
                
                const duration = event.target.duration
                console.log("play duration=", duration)
                obs.trigger('seek_reload', duration)
            });

            this.refs.palyermain.addEventListener('loadeddata', (event) => {
                console.log('loadeddata event=', event);
            });
            this.refs.palyermain.addEventListener('play', ()=>{
                console.log('addEventListener playによるイベント発火')
                comment_anime.play()
            })
            this.refs.palyermain.addEventListener('pause', ()=>{
                console.log('addEventListener pauseによるイベント発火')
                comment_anime.pause()
            })

            this.refs.palyermain.addEventListener('timeupdate', ()=>{
                const current = this.refs.palyermain.currentTime
                obs.trigger('seek_update_current', current)
            })
            let ff = () => {
                setPlayerContainerSize()

                const v_size = getVideoSize()
                this.refs.palyermain.style.width = v_size.width + "px"
                this.refs.palyermain.style.height = v_size.height + "px"
            }

            obs.on("play", ()=> {
                console.log("player.tag play")
                this.refs.palyermain.play()
            })

            obs.on("on_seeked", (current)=> {
                // this.refs.palyermain.pause()
                console.log('player stop currente=', current)
                // $('#player')[0].currentTime = current
                this.refs.palyermain.currentTime = current
                comment_anime.seek(current*1000)
            })

            obs.on("resizeEndEvent", function (wsize) {
                ff()
            })
        })
    </script>
</player-video>