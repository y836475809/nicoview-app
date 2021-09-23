const { app } = require("electron");

class TestParams {
    constructor(base_dir){
        this._base_dir = base_dir;
    }

    load(){
        const name = app.commandLine.getSwitchValue("test");
        if(!name){
            throw new Error("--test has no value");
        }
        const params_json = require("./test-params.json");
        this._params = params_json[name];
        if(!this._params){
            throw new Error(`not find config name=${name}`);
        }
        this._params["mock_server_port"] = params_json.mock_server_port;
        this._params["mock_server_wait_msec"] = params_json.mock_server_wait_msec;
    }

    get main_html_path(){
        return `${this._base_dir}/${this._params["main"]}`;
    }

    get config_fiiename(){
        return this._params["config_fiiename"];
    }

    get use_mock_server(){
        return this._params["use_mock_server"];
    }

    get mock_server_port(){
        return this._params["mock_server_port"];
    }

    get mock_server_wait_msec(){
        return this._params["mock_server_wait_msec"];
    }
}

module.exports = {
    TestParams,
};