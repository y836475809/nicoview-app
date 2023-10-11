const { setupPreload } = require("../src/lib/setup-preload");

process.once("loaded", () => {
    global.TestComments = require("./public/test-comments");
    global.TestTag = require("./public/test-tag");
});

setupPreload();
