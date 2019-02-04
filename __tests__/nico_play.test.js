const test = require("ava");
const { NicoPlay } = require("../app/js/niconico_play");

const { NicoMocks, TestData } = require("./helper/nico_mock");
const { ProfTime } = require("./helper/ava_prof_time");

const prof_time = new ProfTime();
const nico_mocks = new NicoMocks();

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
});

test.afterEach(t => {
    prof_time.end(t);
});

test("nico play", async (t) => {
    t.plan(3);

    nico_mocks.watch();
    nico_mocks.comment();
    nico_mocks.dmc_session();
    nico_mocks.dmc_hb();

    const heart_beat_rate = 1/120;
    const noco_play = new NicoPlay(heart_beat_rate);
    noco_play.play(TestData.video_id, (state)=>{
        console.log("############ state=", state);   
    }).then((result)=>{
        // console.log("############ result=", result);
        t.not(result, undefined);
        
    }).catch(error => {
        console.log("############ error=", error);
    });

    await new Promise(resolve => setTimeout(resolve, 2500));
    t.is(nico_mocks.hb_options_count, 1);
    t.is(nico_mocks.hb_post_count, 2);

    noco_play.stopHB();
});

test.cb("nico play cancel", (t) => {
    t.plan(1);

    nico_mocks.watch(3000);
    // nico_mocks.comment();
    // nico_mocks.dmc_session();
    // nico_mocks.dmc_hb();

    let state_log = "";
    // const heart_beat_rate = 1/120;
    const noco_play = new NicoPlay();

    setTimeout(()=>{
        noco_play.cancel();
    },1000);

    noco_play.play(TestData.video_id, (state)=>{
        console.log("############ state=", state); 
        state_log += state + ":";
    }).then((result)=>{
        console.log("############ result=", result);
        t.not(result, undefined);
    }).catch(error => {
        console.log("############ error=", error);
        t.is(state_log, "start watch:");
        t.end();
    });
});

test.cb("nico play cancel hb", (t) => {
    t.plan(5);

    nico_mocks.watch();
    nico_mocks.comment();
    nico_mocks.dmc_session();
    nico_mocks.dmc_hb();

    let state_log = "";
    const heart_beat_rate = 1/120;
    const noco_play = new NicoPlay(heart_beat_rate);

    setTimeout(()=>{
        noco_play.cancel();
    },2500);

    setTimeout(()=>{
        t.is(nico_mocks.hb_options_count, 1);
        t.is(nico_mocks.hb_post_count, 2);    
        t.end();
    },6000);   

    noco_play.play(TestData.video_id, (state)=>{
        console.log("############ state=", state); 
        state_log += state + ":";
    }, (error)=>{
        console.log("############ hb cancel error=", error); 
        t.is(state_log, 
            "start watch:finish watch:"
            + "start comment:finish comment:"
            + "start video:start HeartBeat:finish video:");
        t.truthy(error.cancel);
    }).then((result)=>{
        console.log("############ result=", result);
        t.not(result, undefined);
    }).catch(error => {
        console.log("############ error=", error);
        // t.is(state_log, "start watch:");
    });     
});

test.cb("nico play error watch", (t) => {
    t.plan(1);

    nico_mocks.watchNotFindPage(TestData.video_id);
    nico_mocks.comment();
    nico_mocks.dmc_session();
    nico_mocks.dmc_hb();

    let state_log = "";
    const heart_beat_rate = 1/120;
    const noco_play = new NicoPlay(heart_beat_rate);

    // setTimeout(()=>{
    //     noco_play.cancel();
    // },1000);

    noco_play.play(TestData.video_id, (state)=>{
        console.log("############ state=", state); 
        state_log += state + ":";
    }).then((result)=>{
        console.log("############ result=", result);
        t.not(result, undefined);
    }).catch(error => {
        console.log("############ error=", error);
        t.is(state_log, "start watch:");
        t.end();
    });
});