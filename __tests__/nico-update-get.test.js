const test = require("ava");
const { NicoMocks, TestData} = require("./helper/nico-mock");
const { NicoUpdate } = require("../app/js/nico-update");
const { filterComments } = require("../app/js/niconico");

const video_id = TestData.video_id;
const cur_comment = filterComments(TestData.no_owner_comment);
const nico_mocks = new NicoMocks();

test.after(t => {
    nico_mocks.clean();
});

test.beforeEach(t => {
    nico_mocks.clean();
});


test("get", async t => {
    nico_mocks.watch();
    nico_mocks.comment();

    const nico_update = new NicoUpdate(video_id);
    const { thumbInfo, comments } = await nico_update._get(cur_comment);
    t.not(thumbInfo, undefined);
    t.deepEqual(comments, [
        {
            no: 1,
            vpos: 100,
            post_date: 1522161709,
            user_id: "abcdefg",
            mail: "184",
            text: "comment1"
        },
        {
            no: 2,
            vpos: 200,
            post_date: 1522161986,
            user_id: "hijklmn",
            mail: "184",
            text: "comment2"
        },
        {
            no: 3,
            vpos: 10,
            post_date: 1555754900,
            user_id: "a",
            mail: "184",
            text: "! no 3"
        },
        {
            no: 4,
            vpos: 20,
            post_date: 1555754900,
            user_id: "b",
            mail: "184",
            text: "! no 4"
        }]
    );
});

test("watch cancel", async(t) => {
    t.plan(1);

    nico_mocks.watch(3000);
    nico_mocks.comment();

    const nico_update = new NicoUpdate(video_id);

    setTimeout(()=>{
        nico_update.cancel();
    }, 1000);
    try {
        await nico_update._get(cur_comment);
    } catch (error) {
        t.truthy(error.cancel);
    }
});

test("comment cancel", async(t) => {
    t.plan(1);

    nico_mocks.watch();
    nico_mocks.comment(3000);

    const nico_update = new NicoUpdate(video_id);

    setTimeout(()=>{
        nico_update.cancel();
    }, 1000);
    try {
        await nico_update._get(cur_comment);
    } catch (error) {
        t.truthy(error.cancel);
    }
});

test("watch timetout", async (t) => {
    t.plan(3);

    nico_mocks.watch(6000);
    nico_mocks.comment();
        
    const nico_update = new NicoUpdate(video_id);
    try {
        await nico_update._get(cur_comment);
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.name, "Error");
        t.regex(error.message, /time/i);
    }
});

test("comment timetout", async (t) => {
    t.plan(3);

    nico_mocks.watch();
    nico_mocks.comment(6000);
        
    const nico_update = new NicoUpdate(video_id);
    try {
        await nico_update._get(cur_comment);
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.name, "Error");
        t.regex(error.message, /time/i);
    }
});

test("watch 404", async t => {
    t.plan(3);

    nico_mocks.watch(1, 404);
    nico_mocks.comment();

    const nico_update = new NicoUpdate(video_id);
    try {
        await nico_update._get(cur_comment);
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.name, "Error");
        t.regex(error.message, /404:/);
    }
});

test("comment 404", async t => {
    t.plan(3);

    nico_mocks.watch();
    nico_mocks.comment(1, 404);

    const nico_update = new NicoUpdate(video_id);
    try {
        await nico_update._get(cur_comment);
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.name, "Error");
        t.regex(error.message, /404:/);
    }
});