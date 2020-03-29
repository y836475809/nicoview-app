const test = require("ava");
const fs = require("fs");
const reader = require("../app/js/reader");

const dir = `${__dirname}/data`;

test("read user comment", (t) => {
    const xml = fs.readFileSync(`${dir}/sample.xml`, "utf-8");
    const obj = reader.comment(xml, false);
    t.deepEqual(obj[0].thread, {
        resultcode:0,
        thread:"1505300000",
        server_time:1505310000,
        last_res:10,
        ticket:"0x00000000",
        revision:1,
    });
    t.deepEqual(obj[1].thread, {
        resultcode:0,
        thread:"1505300000",
        server_time:1505310000,
        last_res:10,
        ticket:"0x00000000",
        revision:1,
    });
    t.true(hasEqProps(obj[2].chat, 
        {no:1, vpos:400, date:0, user_id:"AAA", mail:"naka medium 184", content:"AAAテスト"}
    ));
    t.true(hasEqProps(obj[3].chat, 
        {no:2,  vpos:300, date:1, user_id:"BBB", mail:"184", content:"BBBあ"}
    ));
    t.true(hasEqProps(obj[4].chat, 
        {no:3,  vpos:1500, date:2, user_id:"CCC", mail:"184", content:"CCCテスト"}
    ));
    t.true(hasEqProps(obj[5].chat, 
        {no:4,  vpos:4000, date:3, user_id:"CCC", mail:"184", content:"CCCテストテスト"}
    ));
    t.true(hasEqProps(obj[6].chat, 
        {no:5,  vpos:100, date:4, user_id:"DDD", mail:"184 device:3DS", content:"DDDテスト"}
    ));
    t.true(hasEqProps(obj[7].chat, 
        {no:6,  vpos:4500, date:5, user_id:"EEE", mail:"184", content:"EEEテスト"}
    ));
});

test("read owner comment", (t) => {
    const xml = fs.readFileSync(`${dir}/sample[Owner].xml`, "utf-8");
    const obj = reader.comment(xml, true);
    t.deepEqual(obj[0].thread, {
        resultcode:0,
        fork:1,
        thread:"1505300000",
        server_time:1505310000,
        last_res:2,
        ticket:"0x00000000",
        revision:1,
    });
    t.true(hasEqProps(obj[1].chat, 
        {no:1, vpos:100, date:1000, fork:1, content:"owner1"}
    ));
    t.true(hasEqProps(obj[2].chat, 
        {no:2,  vpos:200, date:2000, fork:1, mail:"shita", content:"owner2"}
    ));
});

test("read comment deleted", (t) => {
    const xml = fs.readFileSync(`${dir}/sample-deleted.xml`, "utf-8");
    const obj = reader.comment(xml, false);
    t.deepEqual(obj[0].thread, {
        resultcode:0,
        thread:"1505300000",
        server_time:1505310000,
        last_res:10,
        ticket:"0x00000000",
        revision:1,
    });
    t.deepEqual(obj[1].thread, {
        resultcode:0,
        thread:"1505300000",
        server_time:1505310000,
        last_res:10,
        ticket:"0x00000000",
        revision:1,
    });
    t.true(hasEqProps(obj[2].chat, 
        {no:1,  vpos:100, date:10, user_id:"AAA", mail:"184", content:"AAAテスト"}
    ));
    t.true(hasEqProps(obj[3].chat, 
        {no:3,  vpos:300, date:30, user_id:"BBB", mail:"184", content:"BBBテスト"}
    ));
    t.true(hasEqProps(obj[4].chat, 
        {no:4,  vpos:400, date:40, user_id:"CCC", mail:"184", content:"CCCテスト"}
    ));
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

const hasEqProps = (obj, props) => {
    Object.keys(props).forEach(key => {
        if(obj[key] != props[key]){
            throw new Error(`key is ${key}, obj:${obj[key]} not eq props:${props[key]}`);
        }
    });
    return true;
};

test("read json no owner comment", (t) => {
    const text = fs.readFileSync(`${dir}/no-owner-comment.json`, "utf-8");
    const comment = reader.json_comment(text);
    t.deepEqual(comment[0].thread,
        {
            resultcode:0,
            thread:"1234567890",
            server_time:1546694145,
            last_res:2,
            ticket:"0xb18d801d",
            revision:1,
            click_revision:3
        }
    );
    t.true(hasEqProps(comment[1].chat, 
        {no:1, vpos:100, date:1522161709, user_id:"abcdefg", mail:"184", content:"comment1"}));
    t.true(hasEqProps(comment[2].chat, 
        {no:2, vpos:200, date:1522161986, user_id:"hijklmn", mail:"184", content:"comment2"}));
});

test("read json owner comment", (t) => {
    const text = fs.readFileSync(`${dir}/owner-comment.json`, "utf-8");
    const comment = reader.json_comment(text);
    t.deepEqual(comment[0].thread, 
        {
            resultcode:0,
            thread:"1234567890",
            fork: 1,
            server_time:1546694359,
            last_res:2,
            ticket:"1234567890",
            revision:1,
        });
    t.deepEqual(comment[1].thread, 
        {
            resultcode:0,
            thread:"1234567890",
            server_time:1546694359,
            last_res:3336,
            ticket:"0x83d23581",
            revision:2,
        });
    t.deepEqual(comment[2].thread, 
        {
            resultcode:0,
            thread:"1234567890",
            server_time:1546694359,
            last_res:5,
            ticket:"0x83d23581",
            revision:2,
        });

    t.true(hasEqProps(comment[3].chat, 
        {no:1, vpos:100, date:1360996778, fork:1, mail:"shita green small", content:"owner comment1\ncomment1"}));
    t.true(hasEqProps(comment[4].chat, 
        {no:2, vpos:200, date:1360996778, fork:1, mail:"shita green small", content:"owner comment2"}));
    t.true(hasEqProps(comment[5].chat, 
        {no:16, vpos:300, date:1359607148, user_id:"abcdefg", mail:"184", content:"comment3"}));
    t.true(hasEqProps(comment[6].chat, 
        {no:17, vpos:400, date:1359607224, user_id:"hijklnm", mail:"184", content:"comment4"}));
});
