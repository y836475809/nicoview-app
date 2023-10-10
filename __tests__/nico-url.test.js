const test = require("ava");
const NicoUrl = require("../src/lib/nico-url");

test("getURLKind", (t) => {
    t.is(NicoUrl.getURLKind("https://www.nicovideo.jp/watch/12345"), "watch");
    t.is(NicoUrl.getURLKind("https://www.nicovideo.jp/mylist/12345"), "mylist");
    t.is(NicoUrl.getURLKind("https://www.nicovideo.jp/user/12345"), "user");
    t.is(NicoUrl.getURLKind("https://www.nicovideo.jp/user/12345/mylist"), "user");

    t.is(NicoUrl.getURLKind("https://www.test.jp/dummy/12345"), "other");
    t.is(NicoUrl.getURLKind("http://www.test.jp/dummy/12345"), "other");

    t.is(NicoUrl.getURLKind("#"), "pound");
    
    t.throws(() => { NicoUrl.getURLKind("h://www.test.jp/dummy/12345"); });
});

test("getMylistID mylist", (t) => {
    const url = "https://www.nicovideo.jp/mylist/12345";
    const mylist_id = NicoUrl.getMylistID(url);

    t.is(mylist_id, "mylist/12345");
});

test("getMylistID user", (t) => {
    t.is(NicoUrl.getMylistID("https://www.nicovideo.jp/user/12345"), "user/12345");
    t.is(NicoUrl.getMylistID("https://www.nicovideo.jp/user/12345/mylist"), "user/12345");
});

test("getWatchURL", (t) => {
    t.is(NicoUrl.getWatchURL("12345"), "https://www.nicovideo.jp/watch/12345");
});