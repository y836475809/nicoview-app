const path = require("path");
const { setupMain } = require("./lib/setup-main");

const src_dir = __dirname;
const public_dir = path.join(src_dir, "public");
setupMain(
    path.join(public_dir, "index.html"), 
    path.join(public_dir, "player.html"), 
    path.join(src_dir, "preload.js"),
    path.join(src_dir, "css"),
    "config.json");
