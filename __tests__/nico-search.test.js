const test = require("ava");
const { NicoSearchParams, NicoSearch } = require("../src/lib/nico-search");
const { NicoMocks } = require("./helper/nico-mock");

const nico_mocks = new NicoMocks();
const mock_timeout = 121*1000;

const pre_fields = 
    "contentId,title,tags,"
    + "viewCounter,commentCounter,startTime,thumbnailUrl,lengthSeconds";

const default_params = () => {
    const params = new NicoSearchParams();
    params.query("test");
    params.target("keyword");
    params.sortName("startTime");
    params.sortOder("-");
    params.page(1);
    return params;
};

test.afterEach(t => { // eslint-disable-line no-unused-vars
    nico_mocks.clean(); 
});

test.beforeEach(t => { // eslint-disable-line no-unused-vars
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
        params.sortName("commentCounter");
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
        params.target("tag");
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
        params.sortName("dummy");
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
        params.page((100000/32)+2);
        const error = t.throws(() => { params.get(); });
        t.is(error.message, "コンテンツの取得オフセットが\"100032\", 最大数は100000");
    }
});

test("nico search", async t => {
    const word = "test";
    nico_mocks.search(word);

    const pramas = default_params();
    pramas.query(word);
    const nico_search = new NicoSearch();
    const result = await nico_search.search(pramas);
    const page_ifno = result.page_ifno;
    t.is(page_ifno.page_num, 1);
    t.is(page_ifno.total_page_num, 1);
    t.is(page_ifno.search_result_num, 1);
    t.is(result.list.length, 1);
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
    nico_mocks.search(word, 200, mock_timeout);

    const pramas = default_params();
    pramas.query(word);
    const nico_search = new NicoSearch();
    const error = await t.throwsAsync(nico_search.search(pramas));
    t.regex(error.message, /timeout\s*:\s*https/i);
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

async function searchHtml(t, page) {
    const pramas = default_params().getParamsHtml();
    pramas.page = page;
    nico_mocks.searchHtml(
        "search", 
        pramas.query, pramas.query, pramas.page, 
        pramas.sort_name, pramas.sort_order, 
        200, 1);

    const nico_search = new NicoSearch();

    {
        t.is(nico_search._cookie_html, null);
        const result = await nico_search.searchHtml(pramas);
        const page_ifno = result.page_ifno;
        t.is(page_ifno.page_num, page);
        t.true(page_ifno.total_page_num > 0);
        t.true(page_ifno.search_result_num > 0);
        t.is(result.list.length, 32);
        const cookie = nico_search._cookie_html;
        t.is(cookie["nico_gc"], "1srch_s%3Df%26srch_o%3Dd");
        t.is(cookie["nicosid"], "12345.67890");
    }
    {
        const result = await nico_search.searchHtml(pramas);
        const page_ifno = result.page_ifno;
        t.is(page_ifno.page_num, page);
        t.true(page_ifno.total_page_num > 0);
        t.true(page_ifno.search_result_num > 0);
        t.is(result.list.length, 32);
        const cookie = nico_search._cookie_html;
        t.is(cookie["nico_gc"], "2srch_s%3Df%26srch_o%3Dd");
        t.is(cookie["nicosid"], "12345.67890");
    }
}
test("nico search html page2", searchHtml, 1);
test("nico search html page1", searchHtml, 2);

test("nico search html change word, cookie not chnage", async t => {
    const pramas = default_params().getParamsHtml();
    nico_mocks.searchHtml(
        "search", 
        "word1", "word2", pramas.page, 
        pramas.sort_name, pramas.sort_order, 
        200, 1);

    const nico_search = new NicoSearch();

    {
        pramas.query = "word1";
        t.is(nico_search._cookie_html, null);
        await nico_search.searchHtml(pramas);
        const cookie = nico_search._cookie_html;
        t.is(cookie["nico_gc"], "1srch_s%3Df%26srch_o%3Dd");
        t.is(cookie["nicosid"], "12345.67890");
    }
    {
        pramas.query = "word2";
        await nico_search.searchHtml(pramas);
        const cookie = nico_search._cookie_html;
        t.is(cookie["nico_gc"], "1srch_s%3Df%26srch_o%3Dd");
        t.is(cookie["nicosid"], "12345.67890");
    }
});