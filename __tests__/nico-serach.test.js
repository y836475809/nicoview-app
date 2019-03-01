const test = require("ava");
const { NicoSearchParams, NicoSearch } = require("../app/js/niconico-search");
const { NicoMocks } = require("./helper/nico_mock");

const nico_mocks = new NicoMocks();

const pre_fields = 
    "contentId,title,description,tags,"
    + "viewCounter,commentCounter,startTime,thumbnailUrl,lengthSeconds";

const default_params = () => {
    const params = new NicoSearchParams();
    params.keyword("test");
    params.sortTarget("startTime");
    params.sortOder("-");
    params.page(1);
    return params;
};

test.after(t => {
    nico_mocks.clean(); 
});

test.beforeEach(t => {
    nico_mocks.clean(); 
});

test("nico search params", t => {
    const get_act_params =  () =>{      
        return {
            q: "test",
            targets: "title,description,tags",
            fields: pre_fields,
            _sort: "-startTime",
            _offset: 0,
            _limit: 32,
            _context: "electron-app"
        };
    };

    const params = default_params();
    
    {
        const act_params = get_act_params();
        t.deepEqual(params.get(), act_params);
    }
    {
        params.page(2);
        const act_params = get_act_params();
        act_params._offset = 32;
        t.deepEqual(params.get(), act_params);
    }
    {
        params.sortOder("+");
        const act_params = get_act_params();
        act_params._sort = "+startTime";
        t.deepEqual(params.get(), act_params);
    }
    {
        params.sortTarget("commentCounter");
        const act_params = get_act_params();
        act_params._sort = "+commentCounter";
        t.deepEqual(params.get(), act_params);
    }
    {
        params.keyword("test2");
        const act_params = get_act_params();
        act_params.q = "test2";
        act_params._sort = "+commentCounter";
        t.deepEqual(params.get(), act_params);
    }
    {
        params.tag("test");
        const act_params = get_act_params();
        act_params.targets = "tagsExact";
        act_params._sort = "+commentCounter";
        t.deepEqual(params.get(), act_params);
    }
});

test("nico search params error", t => {
    {
        const params = default_params();
        params.keyword("");
        const error = t.throws(() => { params.get(); });
        t.is(error.message, "検索語が空");
    }
    {
        const params = default_params();
        params.tag("");
        const error = t.throws(() => { params.get(); });
        t.is(error.message, "検索語が空");
    }
    {
        const params = default_params();
        params.sortTarget("dummy");
        const error = t.throws(() => { params.get(); });
        t.is(error.message, "dummyはソートの対象外");
    }
    {
        const params = default_params();
        params.sortOder("*");
        const error = t.throws(() => { params.get(); });
        t.is(error.message, "ソート順が\"*\", ソート順は+か-");
    }
    {
        const params = default_params();
        params.page(0);
        const error = t.throws(() => { params.get(); });
        t.is(error.message, "ページ数が\"0\", ページは1以上");
    }
    {
        const params = default_params();
        params.page(52);
        const error = t.throws(() => { params.get(); });
        t.is(error.message, "コンテンツの取得オフセットが\"1632\", 最大数は1600");
    }
});

//TODO
test("nico search", async t => {
    const word = "test";
    nico_mocks.search(word);

    const pramas = default_params();
    pramas.keyword(word);
    // pramas._sort_order = "+";
    const nico_search = new NicoSearch();
    const search_json = await nico_search.search(pramas);
    const meta = search_json.meta;
    t.is(meta.status, 200);
    t.is(meta.totalCount, 1);
    t.is(search_json.data.length, 1);
});

