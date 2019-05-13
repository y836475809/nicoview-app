const test = require("ava");
const { CommentOptionParser } = require("../app/js/comment-timeline");

test("comment option parser naka ue shita big middle small", (t) => {
    const cop = new CommentOptionParser();

    t.deepEqual(cop.parse("naka middle white"), {
        type: "naka",
        font_size:"middle",
        color: "#FFFFFF"
    });

    t.deepEqual(cop.parse("ue big white"), {
        type: "ue",
        font_size:"big",
        color: "#FFFFFF"
    });

    t.deepEqual(cop.parse("shita small white"), {
        type: "shita",
        font_size:"small",
        color: "#FFFFFF"
    });
});

test("comment option parser user color", (t) => {
    const cop = new CommentOptionParser();

    t.deepEqual(cop.parse("naka middle white"), {
        type: "naka",
        font_size:"middle",
        color: "#FFFFFF"
    });

    t.deepEqual(cop.parse("naka middle red"), {
        type: "naka",
        font_size:"middle",
        color: "#FF0000"
    });

    t.deepEqual(cop.parse("naka red middle"), {
        type: "naka",
        font_size:"middle",
        color: "#FF0000"
    });
});

test("comment option parser premium color", (t) => {
    const cop = new CommentOptionParser();

    t.deepEqual(cop.parse("naka middle niconicowhite"), {
        type: "naka",
        font_size:"middle",
        color: "#CCCC99"
    });

    t.deepEqual(cop.parse("naka middle white2"), {
        type: "naka",
        font_size:"middle",
        color: "#CCCC99"
    });

    t.deepEqual(cop.parse("naka middle red2"), {
        type: "naka",
        font_size:"middle",
        color: "#CC0033"
    });

    t.deepEqual(cop.parse("naka middle #111111"), {
        type: "naka",
        font_size:"middle",
        color: "#111111"
    });
});

test("comment option parser empty", (t) => {
    const cop = new CommentOptionParser();
    t.deepEqual(cop.parse(""), {
        type: "naka",
        font_size:"middle",
        color: "#FFFFFF"
    });
});