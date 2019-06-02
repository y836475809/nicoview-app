const test = require("ava");
const { CommentOptionParser } = require("../app/js/comment-timeline");

const user_id = "a";
const owner_id = "owner";

test("comment option parser naka ue shita big middle small", (t) => {
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