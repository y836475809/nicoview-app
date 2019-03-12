const test = require("ava");
const { NicoPlay } = require("../app/js/niconico_play");

const { NicoMocks, TestData } = require("./helper/nico_mock");
const { ProfTime } = require("./helper/ava_prof_time");

const prof_time = new ProfTime();
const nico_mocks = new NicoMocks();

let state_log = "";
const hb_1s_rate = 1/120;

test.before(t => {
    prof_time.clear();
});

test.after(t => {
    prof_time.log(t);

    nico_mocks.clean();
});

test.beforeEach(t => {
    prof_time.start(t);

    nico_mocks.clean();
    state_log = "";
});

test.afterEach(t => {
    prof_time.end(t);
});

test("nico play dmc", async (t) => {
    t.plan(4);

    nico_mocks.watch();
    nico_mocks.comment();
    nico_mocks.dmc_session();
    nico_mocks.dmc_hb();

    const noco_play = new NicoPlay(hb_1s_rate);
    noco_play.play(TestData.video_id, (state)=>{
        state_log += state + ":";
    }).then((result)=>{
        t.not(result, undefined);    
    }).catch(error => {
        t.is(error, undefined);
    });

    await new Promise(resolve => setTimeout(resolve, 2500));
    t.is(state_log, 
        "start watch:finish watch:"
        + "start comment:finish comment:"
        + "start video:start HeartBeat:finish video:");
    t.is(nico_mocks.hb_options_count, 1);
    t.is(nico_mocks.hb_post_count, 2);

    noco_play.stopHB();
});

test.cb("nico play dmc cancel", (t) => {
    t.plan(2);

    nico_mocks.watch(3000);
    // nico_mocks.comment();
    // nico_mocks.dmc_session();
    // nico_mocks.dmc_hb();

    const noco_play = new NicoPlay();

    setTimeout(()=>{
        noco_play.cancel();
    },1000);

    noco_play.play(TestData.video_id, (state)=>{
        state_log += state + ":";
    }).then((result)=>{
        t.not(result, undefined);
    }).catch(error => {
        t.truthy(error.cancel);
        t.is(state_log, "start watch:");
        t.end();
    });
});

test.cb("nico play dmc cancel hb", (t) => {
    t.plan(5);

    nico_mocks.watch();
    nico_mocks.comment();
    nico_mocks.dmc_session();
    nico_mocks.dmc_hb();

    const noco_play = new NicoPlay(hb_1s_rate);

    setTimeout(()=>{
        noco_play.cancel();
    },2500);

    setTimeout(()=>{
        t.is(nico_mocks.hb_options_count, 1);
        t.is(nico_mocks.hb_post_count, 2);    
        t.end();
    },6000);   

    noco_play.play(TestData.video_id, (state)=>{
        state_log += state + ":";
    }, (error)=>{
        t.is(state_log, 
            "start watch:finish watch:"
            + "start comment:finish comment:"
            + "start video:start HeartBeat:finish video:");
        t.truthy(error.cancel);
    }).then((result)=>{
        t.not(result, undefined);
    }).catch(error => {
        t.is(error, undefined);
    });     
});

test.cb("nico play dmc error watch", (t) => {
    t.plan(3);

    nico_mocks.watchNotFindPage(TestData.video_id);
    nico_mocks.comment();
    nico_mocks.dmc_session();
    nico_mocks.dmc_hb();

    const noco_play = new NicoPlay(hb_1s_rate);

    noco_play.play(TestData.video_id, (state)=>{
        state_log += state + ":";
    }).then((result)=>{
        t.not(result, undefined);
    }).catch(error => {
        t.is(error.cancel, undefined);
        t.is(error.name, "Error");
        t.is(state_log, "start watch:");
        t.end();
    });
});

test.cb("nico play dmc error comment", (t) => {
    t.plan(3);

    nico_mocks.watch();
    nico_mocks.comment_error(403);
    nico_mocks.dmc_session();
    nico_mocks.dmc_hb();

    const noco_play = new NicoPlay(hb_1s_rate);

    noco_play.play(TestData.video_id, (state)=>{
        state_log += state + ":";
    }).then((result)=>{
        t.not(result, undefined);
    }).catch(error => {
        t.is(error.cancel, undefined);
        t.is(error.name, "Error");
        t.is(state_log, "start watch:finish watch:start comment:");
        t.end();
    });
});

test.cb("nico play dmc error dmc_session", (t) => {
    t.plan(5);

    nico_mocks.watch();
    nico_mocks.comment();
    nico_mocks.dmc_session_error();
    nico_mocks.dmc_hb();

    const noco_play = new NicoPlay(hb_1s_rate);

    noco_play.play(TestData.video_id, (state)=>{
        state_log += state + ":";
    }).then((result)=>{
        t.not(result, undefined);
    }).catch(error => {
        t.is(error.cancel, undefined);
        t.is(error.name, "Error");
        t.is(state_log, 
            "start watch:finish watch:"
            + "start comment:finish comment:"
            + "start video:");
        t.is(nico_mocks.hb_options_count, 0);
        t.is(nico_mocks.hb_post_count, 0);
        t.end();
    });
});

test.cb("nico play dmc error hb_options", (t) => {
    t.plan(5);

    nico_mocks.watch();
    nico_mocks.comment();
    nico_mocks.dmc_session();
    nico_mocks.dmc_hb_options_error(403);

    const noco_play = new NicoPlay(hb_1s_rate);

    noco_play.play(TestData.video_id, (state)=>{
        state_log += state + ":";
    }).then((result)=>{
        t.not(result, undefined);
    }).catch(error => {
        t.is(error.cancel, undefined);
        t.is(error.name, "Error");
        t.is(state_log, 
            "start watch:finish watch:"
            + "start comment:finish comment:"
            + "start video:");
        t.is(nico_mocks.hb_options_count, 0);
        t.is(nico_mocks.hb_post_count, 0);
        t.end();
    });
});

test.cb("nico play dmc error hb_post", (t) => {
    t.plan(7);

    nico_mocks.watch();
    nico_mocks.comment();
    nico_mocks.dmc_session();
    nico_mocks.dmc_hb_post_error(403);

    const noco_play = new NicoPlay(hb_1s_rate);

    noco_play.play(TestData.video_id, (state)=>{
        state_log += state + ":";
    }, (hb_error)=>{
        t.is(hb_error.cancel, undefined);
        t.is(hb_error.name, "Error");
        t.is(state_log, 
            "start watch:finish watch:"
            + "start comment:finish comment:"
            + "start video:start HeartBeat:finish video:");
        t.is(nico_mocks.hb_options_count, 1);
        t.is(nico_mocks.hb_post_count, 0);
        t.is(noco_play.nico_video.heart_beat_id, null);
        t.end();        
    }).then((result)=>{
        t.not(result, undefined);
    }).catch(error => {
        t.is(error, undefined);
    });
});

test("nico play smile", async (t) => {
    t.plan(4);

    nico_mocks.watch();
    nico_mocks.comment();
    // nico_mocks.dmc_session();
    // nico_mocks.dmc_hb();

    const noco_play = new NicoPlay();
    noco_play.setForceSmile(true);

    noco_play.play(TestData.video_id, (state)=>{
        state_log += state + ":";
    }).then((result)=>{
        t.not(result, undefined);    
    }).catch(error => {
        t.is(error, undefined);
    });

    await new Promise(resolve => setTimeout(resolve, 2500));
    t.is(state_log, 
        "start watch:finish watch:"
        + "start comment:finish comment:"
        + "start video:finish smile:");
    t.is(nico_mocks.hb_options_count, 0);
    t.is(nico_mocks.hb_post_count, 0);
});

test("nico play filter comment", (t) => {
    const comments = TestData.owner_comment;
    const nico_play = new NicoPlay();
    const filter_comments = nico_play._filterCommnets(comments);
    t.is(filter_comments.length, 4);
    t.deepEqual(filter_comments, [
        {no:1, vpos:100, post_date:1360996778, user_id:"owner", mail:"shita green small", text:"owner comment1\ncomment1"},
        {no:2, vpos:200, post_date:1360996778, user_id:"owner", mail:"shita green small", text:"owner comment2"},
        {no:16, vpos:300, post_date:1359607148, user_id:"abcdefg", mail:"184", text:"comment3"},
        {no:17, vpos:400, post_date:1359607224, user_id:"hijklnm", mail:"184", text:"comment4"},
    ]);
});