const { app } = require("electron");
const path = require("path");
const { setupMain } = require("../src/lib/setup-main");

const base_dir = __dirname;

app.setName("nicoview-app-test");
app.setPath("userData", path.join(base_dir, "userData"));

// 環境変数にログファイルパスを設定
process.env["nicoappview_log_file_path"] = 
    path.join(app.getPath("userData"), "logs/app.log");

const src_dir = path.join(path.dirname(base_dir), "src");
const public_dir = path.join(src_dir, "public");
const main_html_path = path.join(public_dir, "index.html")

setupMain( 
    main_html_path, 
    path.join(public_dir, "player.html"), 
    path.join(base_dir, "test-preload.js"),
    path.join(src_dir, "css"),
    "config-debug.json");
