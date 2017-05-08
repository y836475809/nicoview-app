
var video_size = {}

var getContentSize = () => {
    let w = window.innerWidth - 16
    let h = window.innerHeight - 16
    return { width: w, height: h }
}

var getVideoSize = () => {
    let w_h = getContentSize().height
    let ctr_h = $('#player-ctr').height()

    let v_h = w_h - ctr_h
    let v_w = video_size.width / video_size.height * v_h
    // console.log("getVideoSize video_size=", video_size)
    let c_size = getContentSize()
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
    let player_ctr_h = $('#player-ctr').height()

    let v_size = getVideoSize()
    // console.log("v_size=", v_size)

    let player = $('#player').get(0)
    // play.style.left = (h - player_ctr_h)  + "px"
    let play_top = (h - player_ctr_h) / 2 - (v_size.height) / 2
    let play_left = w / 2 - (v_size.width) / 2
    player.style.top = play_top + "px"
    player.style.left = play_left + "px"
}

var setVideoContainerSize = () => {
    let h = getContentSize().height
    let w = getContentSize().width
    let player_ctr_h = $('#player-ctr').height()

    let con = document.getElementById("container")
    con.style.height = (h - player_ctr_h) + "px"
    con.style.clip = "rect(0px " + w + "px " + (h - player_ctr_h) + "px 0px)"
 
    let ctr = $('#player-ctr').get(0)
    ctr.style.top = (h+8 - player_ctr_h) + "px"
}


window.onload = () => {

    setVideoContainerSize()

    $('#play-btn').on("click", () => {
        let video = $('#player').get(0)
        video.src = "mov/test.mp4"
        // video.src = "mov/oc.mp4"
        video.type = "video/mp4"
        video.load();
    });

    $('#add-btn').on("click", () => {
        const top = 50
        const duration = 5000
        let w = getContentSize().width
        let params = create_comment_elm("container","message", w, duration)
        let sp = params.sp
        let ele = params.ele
        // document.getElementById("container").appendChild(ele);
        // let rect = ele.getBoundingClientRect()
        ele.style.top = top + "px"
        // const duration = 5000
        // let param = set_comment(ele, "container", top, w, duration)

        // console.log(rect)
        let params2 = create_comment_elm("container","message", w, duration)
        let ele2 = params2.ele
        // document.getElementById("container").appendChild(ele);
        // let rect = ele.getBoundingClientRect()
        ele2.style.top = top*2 + "px"
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

        let pp = create_fix_comment("container", "1fixed_message", w-250, 1000)
        let f_ele = pp.ele
        f_ele.style.display = 'none'
        // create_fix_comment("container", "2fixed_message", w, 1000)
        var myAnimation = anime({
        targets: '.fix_comment',
        translateX: 0,
        delay: 2000,
        duration: 5000,
        begin: function(anim) {
            let ele = anim.animatables[0].target
            ele.style.display = 'inline'
            // console.log(index);
            // console.log(anim);
            console.log(anim.began); // true after 1000ms
        },
        complete: function(anim) {
            let ele = anim.animatables[0].target
            ele.style.display = 'none'
            console.log("anim.completed=", anim.completed);
        }        
        });

        comment_anime.play()
    });

    $('#player').on('loadedmetadata', function (event) {
        let w = event.target.videoWidth
        let h = event.target.videoHeight

        video_size = { width: w, height: h }

        setPlayerContainerSize()

        const v_size = getVideoSize()
        $('#player').width(v_size.width)
        $('#player').height(v_size.height)
    })

    window.addEventListener('resizeend', function () {
        setVideoContainerSize()
        setPlayerContainerSize()

        const v_size = getVideoSize()
        $('#player').width(v_size.width)
        $('#player').height(v_size.height)
    });
}