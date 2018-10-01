<player-video >
    <style scoped>
        :scope { 
            position: relative;
        }
        #player-video-screen {
            width: 100%;
            height: 100%;   
        }      
        #player {
            width: 100%;
            height: 100%;         
        }
        .comment{
            float:left;
            color: white;
            border: 1px solid #FF6600;
        }
    </style>

    <div id="player-video-screen">
        <video ref="palyermain" id="player" autoplay preload='metadata' controls>
        </video>
    </div>

    <script>
        const remote = require('electron').remote;
        const base_dir = remote.getGlobal('sharedObj').base_dir;
        var $ = jQuery = require("jquery");
        var anime = require('animejs');

        let comment_anime = null;
        let my = [];
        // var create_comment_elm = require('../../comment')
        let comment_elm = require(`${base_dir}/comment`);
        let nico_comment = require(`${base_dir}/nico_comment`);

        obs.on("receivedData", (data) => {
            if (comment_anime !== null) {
                anime.remove('.comment');
                $('.comment').remove();
            };

            console.log('data=', data);

            let video = this.refs.palyermain;
            video.src = data.src;
            video.type = data.type;
            video.load();

            let nc_elms = [];
            let nc_params = [];
            const parent_id = "player-video-screen";
            // const parent_id = "player-video-content";
            // const width = getContentSize().width;
            const width = window.innerWidth;
            const duration = 5000;
            let commnets = data.commnets;
            let cm_elm = new comment_elm(parent_id, width, duration);
            commnets.forEach((cm) => {
                const no = cm.no;
                const text = cm.text;
                const delay = cm.vpos*10;
                ret = cm_elm.cretae_flow(no, text, delay);
                nc_elms.push(ret.ele);
                nc_params.push(ret.params);

            });

            const num = 12;
            // const c_top = this.refs.palyercontainer.offsetTop
            let cm = new nico_comment(num);
            cm.width = width;
            cm.comments = nc_params;
            cm.calc_comment();

            let lanes_map;
            let calc_cms = cm.comments;
            calc_cms.forEach((cm, index) => {
                // lanes_map[cm.no] = cm.lane_index
                let em = nc_elms[index];
                em.style.position = "absolute";
                em.style.top = (cm.lane_index * 50) + "px";
            });


            comment_anime = anime({
                targets: '.comment',
                translateX: function (el) {
                    return el.getAttribute('data-x');
                },
                duration: function (target) {
                    return duration;
                },
                delay: function (target, index) {
                    return target.getAttribute('data-delay');
                },
                easing: 'linear',
                loop: false,
                autoplay: false
            });
        });

        invert = () => {
            console.log('invert');
            let video = this.refs.palyermain;
            video.src = "mov/test.mp4";
            // video.src = "mov/oc.mp4";
            video.type = "video/mp4";
            video.load();
        };

        add = () => {
            comment_anime.play();

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
        };

        this.on('mount', function () {
            console.log('mount');

            this.refs.palyermain.addEventListener('loadedmetadata', (event) => {
                video_size = {
                    width: event.target.videoWidth,
                    height: event.target.videoHeight
                }
                obs.trigger('resizePlayer', video_size);
                obs.trigger('seek_reload', this.refs.palyermain.duration);
            });

            this.refs.palyermain.addEventListener('loadeddata', (event) => {
                console.log('loadeddata event=', event);
            });
            this.refs.palyermain.addEventListener('play', () => {
                console.log('addEventListener playによるイベント発火');
                comment_anime.play();
            });
            this.refs.palyermain.addEventListener('pause', () => {
                console.log('addEventListener pauseによるイベント発火');
                comment_anime.pause();
            });

            this.refs.palyermain.addEventListener('timeupdate', () => {
                const current = this.refs.palyermain.currentTime;
                obs.trigger('seek_update', current);
            });
            this.refs.palyermain.addEventListener('progress', function(){
                console.log('addEventListener progressによるイベント発火');
            }); 
            this.refs.palyermain.addEventListener('waiting', function(){
                console.log('addEventListener waitingによるイベント発火');
            }); 
            this.refs.palyermain.addEventListener('canplay', function(){
                console.log('addEventListener canplayによるイベント発火');
            }); 
            this.refs.palyermain.addEventListener('playing', function(){
                console.log('addEventListener playingによるイベント発火');
            });
            obs.on("play", () => {
                console.log("player.tag play");
                this.refs.palyermain.play();
            });
            obs.on("pause", () => {
                console.log("player.tag pause");
                this.refs.palyermain.pause();
            });

            obs.on("on_seeked", (current) => {
                // this.refs.palyermain.pause();
                // $('#player')[0].currentTime = current;
                
                if(this.refs.palyermain.paused){
                    this.refs.palyermain.currentTime = current;
                    comment_anime.seek(current * 1000);
                }else{
                    console.log('player paused');
                    this.refs.palyermain.pause();
                    comment_anime.pause();

                    this.refs.palyermain.currentTime = current;
                    comment_anime.seek(current * 1000);

                    this.refs.palyermain.play();
                    comment_anime.play();
                }    
            });

            obs.on("resizeEndEvent", function (wsize) {
                // ff()
            });
        })
    </script>
</player-video>