const test = require("ava");
const { NicoMylist } = require("../app/js/nico-mylist");
const { NicoMylistMocks } = require("./helper/nico_mock");
const { ProfTime } = require("./helper/ava_prof_time");

const prof_time = new ProfTime();
const nico_mylist_mocks = new NicoMylistMocks();
const getMylisID = (id) => {
    return `mylist/${id}`;
};

test.before(t => {
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

test("mylist get", async (t) => {
    const id = "10";
    nico_mylist_mocks.mylist(id);

    const nico_mylist = new NicoMylist();
    const xml = await nico_mylist.getXML(getMylisID(id));

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
        await nico_mylist.getXML(getMylisID(id));
    } catch (error) {
        t.truthy(error.cancel);
    }
});

test("mylist timetout", async (t) => {
    t.plan(3);

    const id = "10";
    nico_mylist_mocks.mylist(id, 6000);
        
    const nico_mylist = new NicoMylist();
    try {
        await nico_mylist.getXML(getMylisID(id));
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.name, "Error");
        t.regex(error.message, /time/i);
    }
});

test("mylist 404", async t => {
    t.plan(3);

    const id = "10";
    nico_mylist_mocks.mylist(id, 1, 404);
    
    const nico_mylist = new NicoMylist();
    try {
        await nico_mylist.getXML(getMylisID(id));
    } catch (error) {
        t.is(error.cancel, undefined);
        t.is(error.name, "Error");
        t.regex(error.message, /404:/);
    }
});