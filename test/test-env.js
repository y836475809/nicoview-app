const { app } = require("electron");
const path = require("path");

class TestEnv {
    constructor(app_dir){
        this.app_dir = app_dir;
    }
    setup(){
        const { TestParams } = require("./test-params");
        this.test_params = new TestParams(this.app_dir);
        this.test_params.load();

        if(this.test_params.use_mock_server){
            const { setupMockServer } = require("./mock_server/nico-mock-server");
            setupMockServer(this.test_params.mock_server_port, this.test_params.mock_server_wait_msec);
        }

        process.env["test_nicoappview"] = "true";
        // テスト時はテスト用のユーザーデータフォルダを使用
        app.setPath("userData", `${app.getPath("userData")}-test`);
    
        // 環境変数にログファイルパスを設定
        process.env["nicoappview_log_file_path"] = 
            path.join(app.getPath("userData"), "logs/app.log");

    }
    get main_html_path(){
        return this.test_params.main_html_path;
    }
    get config_fiiename(){
        return this.test_params.config_fiiename;
    }
}

module.exports = {
    TestEnv,
};