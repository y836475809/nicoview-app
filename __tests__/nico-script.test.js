const test = require("ava");
const { NicoScript } = require("../app/js/comment-timeline");


const no_script_comments =  [
    { user_id: "a", content: "text1", mail:"184" },
    { user_id: "a", content: "text2", mail:"184" }
];

const getScriptComments = (sc_text, sc_mail) => {
    return [
        { user_id: "owner", content: sc_text, mail:sc_mail },
        { user_id: "owner", content: "text1", mail:"184" },
        { user_id: "owner", content: "text2", mail:"green 184" },
        { user_id: "owner", content: "text3", mail:"small 184" },
        { user_id: "owner", content: "text4", mail:"green small 184" },
        { user_id: "a", content: "text5", mail:"184" },
        { user_id: "a", content: "text6", mail:"green 184" },
        { user_id: "a", content: "text7", mail:"small 184" },
        { user_id: "a", content: "text8", mail:"green small 184" },
    ];
};

test("no script", t => {
    const nico_script = new NicoScript();
    const comments = nico_script.getApplied(no_script_comments);
    t.deepEqual(comments, no_script_comments);  
});

test("default script", t => {
    const nico_script = new NicoScript();
    const default_comments = getScriptComments("@デフォルト", "red big");
    const comments = nico_script.getApplied(default_comments);
    t.deepEqual(comments, [
        { user_id: "owner", content: "text1", mail:"184 red big" },
        { user_id: "owner", content: "text2", mail:"green 184 big" },
        { user_id: "owner", content: "text3", mail:"small 184 red" },
        { user_id: "owner", content: "text4", mail:"green small 184" },
        { user_id: "a", content: "text5", mail:"184 red big" },
        { user_id: "a", content: "text6", mail:"green 184 big" },
        { user_id: "a", content: "text7", mail:"small 184 red" },
        { user_id: "a", content: "text8", mail:"green small 184" },
    ]);
});

test("default script 全角", t => {
    const nico_script = new NicoScript();
    const default_comments = getScriptComments("＠デフォルト", "red big");
    const comments = nico_script.getApplied(default_comments);
    t.deepEqual(comments, [
        { user_id: "owner", content: "text1", mail:"184 red big" },
        { user_id: "owner", content: "text2", mail:"green 184 big" },
        { user_id: "owner", content: "text3", mail:"small 184 red" },
        { user_id: "owner", content: "text4", mail:"green small 184" },
        { user_id: "a", content: "text5", mail:"184 red big" },
        { user_id: "a", content: "text6", mail:"green 184 big" },
        { user_id: "a", content: "text7", mail:"small 184 red" },
        { user_id: "a", content: "text8", mail:"green small 184" },
    ]);
});

test("other script", t => {
    const nico_script = new NicoScript();

    {
        const comments = nico_script.getApplied([
            { user_id: "owner", content: "@置換", mail:"" },
            { user_id: "a", content: "text", mail:"184" }]);
        t.deepEqual(comments, [{ user_id: "a", content: "text", mail:"184" }]);
    }
    {
        const comments = nico_script.getApplied([
            { user_id: "owner", content: "@逆", mail:"" },
            { user_id: "a", content: "text", mail:"184" }]);
        t.deepEqual(comments, [{ user_id: "a", content: "text", mail:"184" }]);
    }
    {
        const comments = nico_script.getApplied([
            { user_id: "owner", content: "@コメント禁止", mail:"" },
            { user_id: "a", content: "text", mail:"184" }]);
        t.deepEqual(comments, [{ user_id: "a", content: "text", mail:"184" }]);
    }
    {
        const comments = nico_script.getApplied([
            { user_id: "owner", content: "@シーク禁止", mail:"" },
            { user_id: "a", content: "text", mail:"184" }]);
        t.deepEqual(comments, [{ user_id: "a", content: "text", mail:"184" }]);
    }
    {
        const comments = nico_script.getApplied([
            { user_id: "owner", content: "@ジャンプ", mail:"" },
            { user_id: "a", content: "text", mail:"184" }]);
        t.deepEqual(comments, [{ user_id: "a", content: "text", mail:"184" }]);
    }
    {
        const comments = nico_script.getApplied([
            { user_id: "owner", content: "@ピザ", mail:"" },
            { user_id: "a", content: "text", mail:"184" }]);
        t.deepEqual(comments, [{ user_id: "a", content: "text", mail:"184" }]);
    }
});