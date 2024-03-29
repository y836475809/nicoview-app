const test = require("ava");
const { NicoPlay } = require("../src/lib/nico-play");

const { NicoMocks, TestData } = require("./helper/nico-mock");
const { ProfTime } = require("./helper/ava-prof-time");

const prof_time = new ProfTime();
const nico_mocks = new NicoMocks();

let state_log = "";
const hb_1s_rate = 1/120;

test.before(t => { // eslint-disable-line no-unused-vars
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

const createNicoPlay = (hb_rate) => {
    if(!hb_rate){
        hb_rate = 0.9;
    }
    const nico_play = new NicoPlay(hb_rate);
    nico_play.on("changeState", (state)=>{
        state_log += state + ":";
    });
    nico_play.on("cancelHeartBeat", ()=>{
        state_log += "cancelHeartBeat" + ":";
    });
    nico_play.on("errorHeartBeat", (error)=>{ // eslint-disable-line no-unused-vars
        state_log += "errorHeartBeat" + ":";
    });
    return nico_play;
};

test("nico play dmc", async (t) => {
    t.plan(4);

    nico_mocks.watch();
    nico_mocks.comment();
    nico_mocks.dmc_session();
    nico_mocks.dmc_hb();

    const nico_play = createNicoPlay(hb_1s_rate);

    nico_play.play(TestData.video_id).then((result)=>{
        t.not(result, undefined);    
    }).catch(error => {
        t.is(error, undefined);
    });

    await new Promise(resolve => setTimeout(resolve, 2500));
    t.is(state_log, 
        "startWatch:finishWatch:"
        + "startComment:finishComment:"
        + "startHeartBeat:startPlayVideo:");
    t.is(nico_mocks.hb_options_count, 1);
    t.is(nico_mocks.hb_post_count, 2);

    nico_play.stopHB();
});

test("nico play dmc cancel", async (t) => {
    t.plan(2);

    await new Promise(resolve => {
        nico_mocks.watch(3000);
        
        const nico_play = createNicoPlay();
    
        setTimeout(()=>{
            nico_play.cancel();
        },1000);

        nico_play.play(TestData.video_id).then((result)=>{
            t.not(result, undefined);
        }).catch(error => {
            t.truthy(error.cancel);
            t.is(state_log, "startWatch:");
            resolve();
        });
    });
});

test("nico play dmc cancel hb",async (t) => {
    t.plan(4);

    nico_mocks.watch();
    nico_mocks.comment();
    nico_mocks.dmc_session();
    nico_mocks.dmc_hb(1, 0.8*1000); // 3回目のhbの途中でcancelするようにdelay調整

    const nico_play = createNicoPlay(hb_1s_rate);

    await new Promise(resolve => {
        setTimeout(()=>{
            nico_play.cancel();
        },2500);

        setTimeout(()=>{
            t.is(nico_mocks.hb_options_count, 1);
            t.is(nico_mocks.hb_post_count, 2);  
            t.is(state_log, 
                "startWatch:finishWatch:"
                + "startComment:finishComment:"
                + "startHeartBeat:startPlayVideo:"
                + "cancelHeartBeat:");  
            resolve();
        },6000);   

        nico_play.play(TestData.video_id).then((result)=>{
            t.not(result, undefined);
        }).catch(error => {
            t.is(error, undefined);
        });   
    });  
});

test("nico play dmc error watch", async (t) => {
    t.plan(3);

    nico_mocks.watch(1, 404);
    nico_mocks.comment();
    nico_mocks.dmc_session();
    nico_mocks.dmc_hb();

    const nico_play = createNicoPlay(hb_1s_rate);

    await new Promise(resolve => {
        nico_play.play(TestData.video_id).then((result)=>{
            t.not(result, undefined);
        }).catch(error => {
            t.is(error.cancel, undefined);
            t.is(error.name, "Error");
            t.is(state_log, "startWatch:");
            resolve();
        });
    });
});

test("nico play dmc error comment", async (t) => {
    t.plan(3);

    nico_mocks.watch();
    nico_mocks.comment(1, 403);
    nico_mocks.dmc_session();
    nico_mocks.dmc_hb();

    const nico_play = createNicoPlay(hb_1s_rate);

    await new Promise(resolve => {
        nico_play.play(TestData.video_id,).then((result)=>{
            t.not(result, undefined);
        }).catch(error => {
            t.is(error.cancel, undefined);
            t.is(error.name, "Error");
            t.is(state_log, "startWatch:finishWatch:startComment:");
            resolve();
        });
    });
});

test("nico play dmc error dmc_session", async (t) => {
    t.plan(5);

    nico_mocks.watch();
    nico_mocks.comment();
    nico_mocks.dmc_session_error();
    nico_mocks.dmc_hb();

    const nico_play = createNicoPlay(hb_1s_rate);

    await new Promise(resolve => {
        nico_play.play(TestData.video_id).then((result)=>{
            t.not(result, undefined);
        }).catch(error => {
            t.is(error.cancel, undefined);
            t.is(error.name, "Error");
            t.is(state_log, 
                "startWatch:finishWatch:"
                + "startComment:finishComment:");
            t.is(nico_mocks.hb_options_count, 0);
            t.is(nico_mocks.hb_post_count, 0);
            resolve();
        });
    });
});

test("nico play dmc error hb_options", async (t) => {
    t.plan(5);

    nico_mocks.watch();
    nico_mocks.comment();
    nico_mocks.dmc_session();
    nico_mocks.dmc_hb_options_error(403);

    const nico_play = createNicoPlay(hb_1s_rate);

    await new Promise(resolve => {
        nico_play.play(TestData.video_id).then((result)=>{
            t.not(result, undefined);
        }).catch(error => {
            t.is(error.cancel, undefined);
            t.is(error.name, "Error");
            t.is(state_log, 
                "startWatch:finishWatch:"
                + "startComment:finishComment:");
            t.is(nico_mocks.hb_options_count, 0);
            t.is(nico_mocks.hb_post_count, 0);
            resolve();
        });
    });
});

test("nico play dmc error hb_post", async (t) => {
    t.plan(5);

    nico_mocks.watch();
    nico_mocks.comment();
    nico_mocks.dmc_session();
    nico_mocks.dmc_hb_post_error(403);

    const nico_play = createNicoPlay(hb_1s_rate);

    nico_play.play(TestData.video_id).then((result)=>{
        t.not(result, undefined); 
    }).catch(error => {
        t.is(error, undefined);
    });

    await new Promise(resolve => setTimeout(resolve, 2500));
    t.is(state_log, 
        "startWatch:finishWatch:"
        + "startComment:finishComment:"
        + "startHeartBeat:startPlayVideo:"
        + "errorHeartBeat:");
    t.is(nico_mocks.hb_options_count, 1);
    t.is(nico_mocks.hb_post_count, 0);
    t.is(nico_play.nico_video._heart_beat_id, null);
});
