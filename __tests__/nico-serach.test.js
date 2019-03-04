const test = require("ava");
const { NicoSearchParams, NicoSearch } = require("../app/js/niconico-search");
const { NicoMocks } = require("./helper/nico_mock");

const nico_mocks = new NicoMocks();

const pre_fields = 
    "contentId,title,description,tags,"
    + "viewCounter,commentCounter,startTime,thumbnailUrl,lengthSeconds";

const default_params = () => {
    const params = new NicoSearchParams();
    params.query("test");
    params.cond("keyword");
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
        params.query("test2");
        const act_params = get_act_params();
        act_params.q = "test2";
        act_params._sort = "+commentCounter";
        t.deepEqual(params.get(), act_params);
    }
    {
        params.cond("tag");
        params.query("test");
        const act_params = get_act_params();
        act_params.targets = "tagsExact";
        act_params._sort = "+commentCounter";
        t.deepEqual(params.get(), act_params);
    }
});

test("nico search params error", t => {
    {
        const params = default_params();
        params.query("");
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

test("nico search", async t => {
    const word = "test";
    nico_mocks.search(word);

    const pramas = default_params();
    pramas.query(word);
    const nico_search = new NicoSearch();
    const result = await nico_search.search(pramas);
    const meta = result.meta;
    t.is(meta.status, 200);
    t.is(meta.totalCount, 1);
    t.is(result.data.length, 1);
});

test("nico search cancel", async t => {
    const word = "test";
    nico_mocks.search(word, 200, 5*1000);

    const pramas = default_params();
    pramas.query(word);
    const nico_search = new NicoSearch();

    setTimeout(()=>{
        nico_search.cancel();
    }, 1000);

    const error = await t.throwsAsync(nico_search.search(pramas));
    t.truthy(error.cancel);
});

test("nico search timeout", async t => {
    const word = "test";
    nico_mocks.search(word, 200, 6*1000);

    const pramas = default_params();
    pramas.query(word);
    const nico_search = new NicoSearch();
    const error = await t.throwsAsync(nico_search.search(pramas));
    t.regex(error.message, /time/i);
});

test("nico search status error", async t => {
    const word = "test";

    const pramas = default_params();
    pramas.query(word);
    const nico_search = new NicoSearch();

    {
        nico_mocks.search(word, 400);
        const error = await t.throwsAsync(nico_search.search(pramas));
        t.is(error.message, "status=400, 不正なパラメータです");
    }
    {
        nico_mocks.search(word, 404);
        const error = await t.throwsAsync(nico_search.search(pramas));
        t.is(error.message, "status=404, ページが見つかりません");
    }
    {
        nico_mocks.search(word, 500);
        const error = await t.throwsAsync(nico_search.search(pramas));
        t.is(error.message, "status=500, 検索サーバの異常です");
    }
    {
        nico_mocks.search(word, 503);
        const error = await t.throwsAsync(nico_search.search(pramas));
        t.is(error.message, "status=503, サービスがメンテナンス中です");
    }
});

test("nico search json error", async t => {
    const word = "test";

    const pramas = default_params();
    pramas.query(word);
    const nico_search = new NicoSearch();

    nico_mocks.search_incorrect_json(word);
    const error = await t.throwsAsync(nico_search.search(pramas));
    t.regex(error.message, /json/i);
});