const { NicoCommentTimeLine } = require("../app/js/nico-comment-timeline");
const { NicoScript } = require("../app/js/comment-timeline");
const { randomComments, fixedSampleComments } = require("./test-comments");

let cutimer = 0;
let cutimer_id = null;
let enable_timer = false;

const clickTimner = () => {
    const target = document.getElementById("timer_check");
    enable_timer = target.checked;
    if(!enable_timer){
        if(cutimer_id){
            clearInterval(cutimer_id);
            cutimer_id = null;
        }
    }
};


const updateTimer = (time) => {
    const target = document.getElementById("timer");
    target.textContent = time;
};

const duration_sec = 4;

/** @type {NicoCommentTimeLine} */
let comment_tl = null;

const startComment = (comments) =>{
    if(comment_tl){
        comment_tl.clear();
    }

    const area_elm = document.getElementById("area");
    const cm_style = getComputedStyle(document.documentElement);
    const font_family = cm_style.getPropertyValue("--nico-comment-font-family");
    // console.log("tween font_family=", font_family);
    comment_tl = new NicoCommentTimeLine(area_elm, duration_sec, 12, font_family);
    const msg_elm = document.getElementById("message");
    msg_elm.innerText = "start";
    comment_tl.onComplete(()=>{ 
        msg_elm.innerText = "complete";
    });
    comment_tl.create(comments);
    comment_tl.play();

    cutimer = 0;
    updateTimer(cutimer);
    if(enable_timer){
        cutimer_id = setInterval(()=>{
            updateTimer(cutimer);
            cutimer+=100;
        }, 100);
    }
};

const startFlow = () =>{
    const num = parseFloat(document.getElementById("flow-num").value);
    const comments = randomComments(num, 500);
    startComment(comments);
};

const startFix = () =>{
    const comments = fixedSampleComments();
    startComment(comments);
};

const startFlowFix = () =>{
    const num = parseFloat(document.getElementById("flow-num").value);
    const flow_comments = randomComments(num, 500);
    const fixed_comments = fixedSampleComments();
    const comments = flow_comments.concat(fixed_comments);
    startComment(comments);
};

const startSpaces = ()=>{
    const comments = [
        { no: 1, vpos: 100, mail:"184 ue red small", content: "AAAAA" },
        { no: 2, vpos: 110, mail:"184 ue red small", content: "A A A A A" },
        { no: 3, vpos: 120, mail:"184 ue red small", content: "A  A  A  A  A" },
        { no: 4, vpos: 130, mail:"184 ue red small", content: "A   A   A   A   A" },
        { no: 5, vpos: 140, mail:"184 ue red small", content: "A    A    A    A    A" },
        { no: 6, vpos: 150, mail:"184 ue red small", content: "A     A     A     A     A" },
    ];
    startComment(comments);
};

const startFixAA = ()=>{
    /* eslint-disable no-irregular-whitespace */
    const comments = [
        { no: 1, vpos: 100, mail:"184 ue red small", content: 
`┏━━━┓　 　 　 　 　 　 　 　 ┏┓┏━━━┓
┗━━┓┃　 　 　 　 　 　 　 　 ┃┃┃┏━┓┃` },
        { no: 2, vpos: 100, mail:"184 ue red small", content: 
`　 　 　 ┃┃┏━━┓　 　 　 　 ┃┃┗┛┏┛┃
　 　 ┏┛┃┗┓┃┃┏┳┳┓┗┛　 　 ┃┏┛`},
        { no: 3, vpos: 100, mail:"184 ue red small", content: 
`　 ┏┛┏┛　 ┃┣┛┗┻┫┃┏┓　 　 ┣┫　 ‌
　 ┗━┛　 　 ┗┛　 　 　 ┗┛┗┛　 　 ┗┛　 `},
    ];
    startComment(comments);
};

const default_nc_script_comments = () => {
    return [
        { user_id: "owner", no: 1,  vpos: 0,    content: "@デフォルト", mail:"red big" },
        { user_id: "owner", no: 2,  vpos: 0,    content: "text-owner-0" , mail:"" },
        { user_id: "owner", no: 3,  vpos: 20,   content: "text-owner-20", mail:"" },
        { user_id: "a",     no: 1,  vpos: 10,   content: "text-0",   mail:"" },
        { user_id: "a",     no: 2,  vpos: 50,   content: "text-50-green",  mail:"green" },
        { user_id: "a",     no: 3,  vpos: 100,  content: "text-100", mail:"" },
        { user_id: "a",     no: 4,  vpos: 150,  content: "text-150", mail:"" },
        { user_id: "a",     no: 5,  vpos: 200,  content: "text-200", mail:"" },
        { user_id: "a",     no: 6,  vpos: 250,  content: "text-250", mail:"" }
    ];
};

const duration_nc_script_comments = () => {
    return [
        { user_id: "owner", no: 1,  vpos: 0,    content: "text-owner-1", mail:"ue @10" },
        { user_id: "owner", no: 2,  vpos: 100,  content: "text-owner-2" , mail:"ue" },
        { user_id: "owner", no: 3,  vpos: 200,  content: "text-owner-3", mail:"ue" },
        { user_id: "a",     no: 1,  vpos: 300,  content: "text-1", mail:"ue" },
        { user_id: "a",     no: 2,  vpos: 400,  content: "text-2", mail:"ue" },
        { user_id: "a",     no: 3,  vpos: 500,  content: "text-3", mail:"ue" },
        { user_id: "a",     no: 4,  vpos: 600,  content: "text-4", mail:"ue" },
        { user_id: "a",     no: 5,  vpos: 700,  content: "text-5", mail:"ue" },
        { user_id: "a",     no: 6,  vpos: 800,  content: "text-6", mail:"ue" }
    ];
};

const startNicoScriptFlow = ()=>{
    const nico_script = new NicoScript();
    const comments = nico_script.getApplied(default_nc_script_comments());
    startComment(comments);
};

const startNicoScriptFix = ()=>{
    const nico_script = new NicoScript();
    const comments = nico_script.getApplied(duration_nc_script_comments());
    startComment(comments);
};

const seek = () => {
    if(comment_tl){
        const num  = parseFloat(document.getElementById("seek-num").value);
        comment_tl.seek(num);

        cutimer = num*1000;
        updateTimer(cutimer);
    }
};

const playpause = () => {
    if(comment_tl.paused){
        comment_tl.play();
        if(cutimer_id){
            clearInterval(cutimer_id);
        }
        if(enable_timer){
            cutimer_id = setInterval(()=>{
                updateTimer(cutimer);
                cutimer+=100;
            }, 100);
        }
    }else{
        comment_tl.pause();
        if(cutimer_id){
            clearInterval(cutimer_id);
        }
    }
};

module.exports = {
    clickTimner,
    updateTimer, 

    startFlow,
    startFix,
    startFlowFix,

    startSpaces,
    startFixAA,

    startNicoScriptFlow,
    startNicoScriptFix,

    seek,
    playpause,
};
