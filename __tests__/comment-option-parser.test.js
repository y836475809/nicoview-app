const test = require("ava");
const { CommentOptionParser } = require("../app/js/comment-timeline");

test("comment option parser", (t) => {
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
});

test("comment option parser empty", (t) => {
    const cop = new CommentOptionParser();
    t.deepEqual(cop.parse(""), {
        type: "naka",
        font_size:"middle",
        color: "#FFFFFF"
    });
});