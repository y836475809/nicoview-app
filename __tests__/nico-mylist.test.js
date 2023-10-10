const test = require("ava");
const { NicoMylist } = require("../src/lib/nico-mylist");
const { NicoMylistMocks } = require("./helper/nico-mock");
const { ProfTime } = require("./helper/ava-prof-time");

const prof_time = new ProfTime();
const nico_mylist_mocks = new NicoMylistMocks();
const mock_timeout = 121*1000;

const getMylisID = (id) => {
    return `mylist/${id}`;
};

test.before(t => { // eslint-disable-line no-unused-vars
    prof_time.clear();
});

test.after(t => {
    prof_time.log(t);
    nico_mylist_mocks.clean(); 
});

test.beforeEach(t => {
    prof_time.start(t);
    nico_mylist_mocks.clean(); 
});

test.afterEach(t => {
    prof_time.end(t);
});

test("mylist _getURL", (t) => {
    const nico_mylist = new NicoMylist();
    t.is(nico_mylist._getURL("mylist/123456789"), 
        "https://www.nicovideo.jp/mylist/123456789?rss=2.0&numbers=1&sort=6");
    t.is(nico_mylist._getURL("user/123456789"), 
        "https://www.nicovideo.jp/user/123456789/video?rss=2.0&numbers=1&sort=6");

    t.throws(() => { nico_mylist._getURL("123456789"); });
    t.throws(() => { nico_mylist._getURL("user/123456789/mylist"); });
});

test("mylist get", async (t) => {
    const id = "10";
    nico_mylist_mocks.mylist(id);

    const nico_mylist = new NicoMylist();
    const xml = await nico_mylist.requestXML(getMylisID(id));

    t.is(xml, `<rss>${id}<rss>`);
});

test("mylist cancel", async(t) => {
    t.plan(1);

    const id = "10";
    nico_mylist_mocks.mylist(id, 3000);

    const nico_mylist = new NicoMylist();
    setTimeout(()=>{
        nico_mylist.cancel();
    }, 1000);
    try {
        await nico_mylist.requestXML(getMylisID(id));
    } catch (error) {
        t.truthy(error.cancel);
    }
});

test("mylist timetout", async (t) => {
    t.plan(3);

    const id = "10";
    nico_mylist_mocks.mylist(id, mock_timeout);
        
    const nico_mylist = new NicoMylist();
    try {
        await nico_mylist.requestXML(getMylisID(id));
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.name, "Error");
        t.regex(error.message, /timeout\s*:\s*https/i);
    }
});

test("mylist 404", async t => {
    t.plan(3);

    const id = "10";
    nico_mylist_mocks.mylist(id, 1, 404);
    
    const nico_mylist = new NicoMylist();
    try {
        await nico_mylist.requestXML(getMylisID(id));
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.name, "Error");
        t.regex(error.message, /404:/);
    }
});