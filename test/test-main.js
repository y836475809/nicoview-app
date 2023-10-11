const { app } = require("electron");
const path = require("path");
const { setupMain } = require("../src/lib/setup-main");

const base_dir = __dirname;

app.setName("nicoview-app-test");
app.setPath("userData", path.join(base_dir, "userData"));

const test_name = app.commandLine.getSwitchValue("test");

const params_json = require("./test-config.json");
if(params_json["use_mock_server"].includes(test_name)){
    const { setupMockServer } = require("./mock_server/nico-mock-server");
    setupMockServer(
        params_json["mock_server_port"], 
        params_json["mock_server_wait_msec"]);
}
// 環境変数にログファイルパスを設定
process.env["nicoappview_log_file_path"] = 
    path.join(app.getPath("userData"), "logs/app.log");

const src_dir = path.join(path.dirname(base_dir), "src");
const public_dir = path.join(src_dir, "public");

const main_html_path = test_name == "main"?
    path.join(public_dir, "index.html")
    : path.join(base_dir, "public", `test-${test_name}.html`);

setupMain( 
    main_html_path, 
    path.join(public_dir, "player.html"), 
    path.join(base_dir, "test-preload.js"),
    path.join(src_dir, "css"),
    "config-debug.json");
