const fs = require('fs');
const reader = require("../app/js/reader")

const dir = `${__dirname}/data`;

test("read comment", function () {
    const xml = fs.readFileSync(`${dir}/sample.xml`, "utf-8");
    const obj = reader.comment(xml);
    expect(obj).toEqual(
        [
            {no:1,  vpos:400, date:0, user_id:"AAA", mail:"naka medium 184", text:"AAAテスト"},
            {no:2,  vpos:300, date:1, user_id:"BBB", mail:"184", text:"BBBあ"},
            {no:3,  vpos:1500, date:2, user_id:"CCC", mail:"184", text:"CCCテスト"},
            {no:4,  vpos:4000, date:3, user_id:"CCC", mail:"184", text:"CCCテストテスト"},
            {no:5,  vpos:100, date:4, user_id:"DDD", mail:"184 device:3DS", text:"DDDテスト"},
            {no:6,  vpos:4500, date:5, user_id:"EEE", mail:"184", text:"EEEテスト"}
        ]);
});

test("read thumb info", function () {
    const xml = fs.readFileSync(`${dir}/sample[ThumbInfo].xml`, "utf-8");
    const obj = reader.thumb_info(xml);

    expect(obj.video_id).toEqual("sm1000");
    expect(obj.title).toEqual("sample.mp4");
    expect(obj.description).toEqual("投稿コメントサンプル。他sm2000リストmylist/3000");
    expect(obj.thumbnail_url).toEqual("http://tn-skr2.smilevideo.jp/smile?i=1000");
    expect(obj.first_retrieve).toEqual("2000-01-01T01:02:03+09:00");
    expect(obj.length).toEqual("00:45");
    expect(obj.movie_type).toEqual("mp4");
    expect(obj.size_high).toBe(1000);
    expect(obj.size_low).toBe(500);
    expect(obj.view_counter).toBe(100);
    expect(obj.comment_num).toBe(10);
    expect(obj.mylist_counter).toBe(5);
    expect(obj.last_res_body).toEqual("最新コメント1 最新コメント2");
    expect(obj.watch_url).toEqual("http://www.nicovideo.jp/watch/sm1000");
    expect(obj.thumb_type).toEqual("video");
    expect(obj.embeddable).toBe(1);
    expect(obj.no_live_play).toBe(0);
    expect(obj.tags).toEqual([
        {tag:"タグ1", lock:"1"},
        {tag:"タグ2", lock:""},
        {tag:"タグ3", lock:""}
    ]);
    expect(obj.user_id).toEqual("00000");
    expect(obj.user_nickname).toEqual("ニックネーム");
    expect(obj.user_icon_url).toEqual("https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/defaults/blank_s.jpg");
});