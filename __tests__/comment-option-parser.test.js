const test = require("ava");
const { CommentOptionParser } = require("../src/lib/nico-comment-timeline");

const user_id = "a";
const owner_id = "owner";

test("comment option parser type", (t) => {
    const cop = new CommentOptionParser();

    t.is(null, cop._getType("middle white"));

    t.is("naka", cop._getType("naka middle white"));
    t.is("naka", cop._getType("middle naka white"));
    t.is("naka", cop._getType("middle white naka"));

    t.is("shita", cop._getType("shita middle white"));
    t.is("shita", cop._getType("middle shita white"));
    t.is("shita", cop._getType("middle white shita"));

    t.is("ue", cop._getType("ue middle white"));
    t.is("ue", cop._getType("middle ue white"));
    t.is("ue", cop._getType("middle white ue"));

    t.is("naka", cop._getType("naka middle blue"));
    t.is("naka", cop._getType("middle naka blue"));
    t.is("naka", cop._getType("middle blue naka"));
});

test("comment option parser font size", (t) => {
    const cop = new CommentOptionParser();

    t.is(null, cop._getFontSize("naka white"));

    t.is("middle", cop._getFontSize("middle naka white"));
    t.is("middle", cop._getFontSize("naka middle white"));
    t.is("middle", cop._getFontSize("naka white middle"));

    t.is("big", cop._getFontSize("big naka white"));
    t.is("big", cop._getFontSize("naka big white"));
    t.is("big", cop._getFontSize("naka white big"));

    t.is("small", cop._getFontSize("small naka white"));
    t.is("small", cop._getFontSize("naka small white"));
    t.is("small", cop._getFontSize("naka white small"));
});

test("comment option parser", (t) => {
    const cop = new CommentOptionParser();

    t.deepEqual(cop.parse("naka middle white", user_id), {
        type: "naka",
        font_size:"middle",
        color: "#FFFFFF"
    });

    t.deepEqual(cop.parse("ue big white", user_id), {
        type: "ue",
        font_size:"big",
        color: "#FFFFFF"
    });

    t.deepEqual(cop.parse("shita small white", user_id), {
        type: "shita",
        font_size:"small",
        color: "#FFFFFF"
    });

    t.deepEqual(cop.parse("naka small blue", user_id), {
        type: "naka",
        font_size:"small",
        color: "#0000FF"
    });
});

test("comment option parser zenkaku", (t) => {
    const cop = new CommentOptionParser();

    t.deepEqual(cop.parse("naka　middle　white", user_id), {
        type: "naka",
        font_size:"middle",
        color: "#FFFFFF"
    });

    t.deepEqual(cop.parse("ue　big　white", user_id), {
        type: "ue",
        font_size:"big",
        color: "#FFFFFF"
    });

    t.deepEqual(cop.parse("shita　small　white", user_id), {
        type: "shita",
        font_size:"small",
        color: "#FFFFFF"
    });

    t.deepEqual(cop.parse("naka　small　blue", user_id), {
        type: "naka",
        font_size:"small",
        color: "#0000FF"
    });
});

test("comment option parser user color", (t) => {
    const cop = new CommentOptionParser();

    t.deepEqual(cop.parse("naka middle white", user_id), {
        type: "naka",
        font_size:"middle",
        color: "#FFFFFF"
    });

    t.deepEqual(cop.parse("naka middle red", user_id), {
        type: "naka",
        font_size:"middle",
        color: "#FF0000"
    });

    t.deepEqual(cop.parse("naka red middle", user_id), {
        type: "naka",
        font_size:"middle",
        color: "#FF0000"
    });
});

test("comment option parser premium color", (t) => {
    const cop = new CommentOptionParser();

    t.deepEqual(cop.parse("naka middle niconicowhite", user_id), {
        type: "naka",
        font_size:"middle",
        color: "#CCCC99"
    });

    t.deepEqual(cop.parse("naka middle white2", user_id), {
        type: "naka",
        font_size:"middle",
        color: "#CCCC99"
    });

    t.deepEqual(cop.parse("naka middle red2", user_id), {
        type: "naka",
        font_size:"middle",
        color: "#CC0033"
    });

    t.deepEqual(cop.parse("naka middle #111111", user_id), {
        type: "naka",
        font_size:"middle",
        color: "#111111"
    });
});

test("comment option parser @sec", (t) => {
    const cop = new CommentOptionParser();

    t.deepEqual(cop.parse("naka middle @1", owner_id), {
        type: "naka",
        font_size:"middle",
        color: "#FFFFFF",
        duration: 1000
    });

    t.deepEqual(cop.parse("naka middle @1", user_id), {
        type: "naka",
        font_size:"middle",
        color: "#FFFFFF"
    });
});

test("comment option parser empty", (t) => {
    const cop = new CommentOptionParser();
    t.deepEqual(cop.parse("", user_id), {
        type: "naka",
        font_size:"middle",
        color: "#FFFFFF"
    });
});