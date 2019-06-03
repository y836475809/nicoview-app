const test = require("ava");
const { NicoScript } = require("../app/js/comment-timeline");


const normal_comments =  [
    { user_id: "a", text: "text1", mail:"184" },
    { user_id: "a", text: "text2", mail:"184" }
];

const default_comments = [
    { user_id: "owner", text: "@デフォルト", mail:"red big" },
    { user_id: "owner", text: "text1", mail:"184" },
    { user_id: "owner", text: "text2", mail:"green 184" },
    { user_id: "owner", text: "text3", mail:"small 184" },
    { user_id: "owner", text: "text4", mail:"green small 184" },
    { user_id: "a", text: "text5", mail:"184" },
    { user_id: "a", text: "text6", mail:"green 184" },
    { user_id: "a", text: "text7", mail:"small 184" },
    { user_id: "a", text: "text8", mail:"green small 184" },
];

test("not exist script", t => {
    const nico_script = new NicoScript();
    const comments = nico_script.getApplied(normal_comments);
    t.deepEqual(comments, normal_comments);  
});

test("default script", t => {
    const nico_script = new NicoScript();
    const comments = nico_script.getApplied(default_comments);
    t.deepEqual(comments, [
        { user_id: "owner", text: "text1", mail:"184 red big" },
        { user_id: "owner", text: "text2", mail:"green 184 big" },
        { user_id: "owner", text: "text3", mail:"small 184 red" },
        { user_id: "owner", text: "text4", mail:"green small 184" },
        { user_id: "a", text: "text5", mail:"184 red big" },
        { user_id: "a", text: "text6", mail:"green 184 big" },
        { user_id: "a", text: "text7", mail:"small 184 red" },
        { user_id: "a", text: "text8", mail:"green small 184" },
    ]);
});

test("other script", t => {
    const nico_script = new NicoScript();

    {
        const comments = nico_script.getApplied([
            { user_id: "owner", text: "@置換", mail:"" },
            { user_id: "a", text: "text", mail:"184" }]);
        t.deepEqual(comments, [{ user_id: "a", text: "text", mail:"184" }]);
    }
    {
        const comments = nico_script.getApplied([
            { user_id: "owner", text: "@逆", mail:"" },
            { user_id: "a", text: "text", mail:"184" }]);
        t.deepEqual(comments, [{ user_id: "a", text: "text", mail:"184" }]);
    }
    {
        const comments = nico_script.getApplied([
            { user_id: "owner", text: "@コメント禁止", mail:"" },
            { user_id: "a", text: "text", mail:"184" }]);
        t.deepEqual(comments, [{ user_id: "a", text: "text", mail:"184" }]);
    }
    {
        const comments = nico_script.getApplied([
            { user_id: "owner", text: "@シーク禁止", mail:"" },
            { user_id: "a", text: "text", mail:"184" }]);
        t.deepEqual(comments, [{ user_id: "a", text: "text", mail:"184" }]);
    }
    {
        const comments = nico_script.getApplied([
            { user_id: "owner", text: "@ジャンプ", mail:"" },
            { user_id: "a", text: "text", mail:"184" }]);
        t.deepEqual(comments, [{ user_id: "a", text: "text", mail:"184" }]);
    }
    {
        const comments = nico_script.getApplied([
            { user_id: "owner", text: "@ピザ", mail:"" },
            { user_id: "a", text: "text", mail:"184" }]);
        t.deepEqual(comments, [{ user_id: "a", text: "text", mail:"184" }]);
    }
});