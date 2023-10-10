const test = require("ava");
const {NicoAPI} = require("../src/lib/niconico");

test("_getCommentServerUrl ok", (t) => {
    const threads = [
        {server:"url1"},
        {server:"url1"},
    ];
    const nico_api = new NicoAPI();
    t.is(nico_api._getCommentServerUrl(threads), "url1");
});

test("_getCommentServerUrl error", (t) => {
    const threads = [
        {server:"url1"},
        {server:"url2"},
    ];
    const nico_api = new NicoAPI();
    const error = t.throws(() => { nico_api._getCommentServerUrl(threads); });
    t.is(error.message, "several comment servers: url1, url2");
});
