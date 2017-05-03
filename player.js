
var video_size = {}

var getContentSize = () => {
    let w = document.documentElement.clientWidth - 16
    let h = document.documentElement.clientHeight - 16

    return { width: w, height: h }
}

var getVideoSize = () => {
    let w_h = getContentSize().height
    let ctr_h = $('#player-ctr').height()

    let v_h = w_h - ctr_h
    let v_w = video_size.width / video_size.height * v_h

    let c_size = getContentSize()
    if (v_w < c_size.width) {
        return { width: v_w, height: v_h }
    } else {
        let w = c_size.width
        let h = video_size.height / video_size.width * w
        return { width: w, height: h }
    }
}

var setVideoContainerSize = () => {
    let h = getContentSize().height
    let player_ctr_h = $('#player-ctr').height()
    let con = document.getElementById("container")

    con.style.height = (h - player_ctr_h) + "px"
}

window.onload = () => {
    setVideoContainerSize()

    $('#play-btn').on("click", () => {
        let video = $('#player').get(0)
        // video.src = "mov/test.mp4"
        video.src = "mov/oc.mp4"
        video.type = "video/mp4"
        video.load();
    });

    $('#player').on('loadedmetadata', function (event) {
        let w = event.target.videoWidth
        let h = event.target.videoHeight

        video_size = { width: w, height: h }

        const v_size = getVideoSize()
        $('#player').width(v_size.width)
        $('#player').height(v_size.height)
    })

    window.addEventListener('resizeend', function () {
        setVideoContainerSize()

        const v_size = getVideoSize()
        $('#player').width(v_size.width)
        $('#player').height(v_size.height)
    });
}