const test = require("ava");
const fs = require("fs");
const reader = require("../app/js/reader");

const dir = `${__dirname}/data`;

test("read comment", (t) => {
    const xml = fs.readFileSync(`${dir}/sample.xml`, "utf-8");
    const obj = reader.comment(xml);
    t.deepEqual(obj, 
        [
            {no:1,  vpos:400, post_date:0, user_id:"AAA", mail:"naka medium 184", text:"AAAテスト"},
            {no:2,  vpos:300, post_date:1, user_id:"BBB", mail:"184", text:"BBBあ"},
            {no:3,  vpos:1500, post_date:2, user_id:"CCC", mail:"184", text:"CCCテスト"},
            {no:4,  vpos:4000, post_date:3, user_id:"CCC", mail:"184", text:"CCCテストテスト"},
            {no:5,  vpos:100, post_date:4, user_id:"DDD", mail:"184 device:3DS", text:"DDDテスト"},
            {no:6,  vpos:4500, post_date:5, user_id:"EEE", mail:"184", text:"EEEテスト"}
        ]);
});

test("read comment deleted", (t) => {
    const xml = fs.readFileSync(`${dir}/sample-deleted.xml`, "utf-8");
    const obj = reader.comment(xml);
    t.deepEqual(obj, 
        [
            {no:1,  vpos:100, post_date:10, user_id:"AAA", mail:"184", text:"AAAテスト"},
            {no:3,  vpos:300, post_date:30, user_id:"BBB", mail:"184", text:"BBBテスト"},
            {no:4,  vpos:400, post_date:40, user_id:"CCC", mail:"184", text:"CCCテスト"},
        ]);
});

test("read thumb info", (t) => {
    const xml = fs.readFileSync(`${dir}/sample[ThumbInfo].xml`, "utf-8");
    const obj = reader.thumb_info(xml);

    t.is(obj.video_id, "sm1000");
    t.is(obj.title, "sample.mp4");
    t.is(obj.description, "投稿コメントサンプル。他sm2000リストmylist/3000");
    t.is(obj.thumbnail_url, "http://tn-skr2.smilevideo.jp/smile?i=1000");
    t.is(obj.first_retrieve, "2000-01-01T01:02:03+09:00");
    t.is(obj.length, "00:45");
    t.is(obj.video_type, "mp4");
    t.is(obj.size_high, 1000);
    t.is(obj.size_low, 500);
    t.is(obj.view_counter, 100);
    t.is(obj.comment_counter, 10);
    t.is(obj.mylist_counter, 5);
    t.is(obj.last_res_body, "最新コメント1 最新コメント2");
    t.is(obj.watch_url, "http://www.nicovideo.jp/watch/sm1000");
    t.is(obj.thumb_type, "video");
    t.is(obj.embeddable, 1);
    t.is(obj.no_live_play, 0);
    t.deepEqual(obj.tags,
        [
            {text:"タグ1", lock:true},
            {text:"タグ2", lock:false},
            {text:"タグ3", lock:false}
        ]);
    t.is(obj.user_id, "00000");
    t.is(obj.user_nickname, "ニックネーム");
    t.is(obj.user_icon_url, "https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/defaults/blank_s.jpg");
});