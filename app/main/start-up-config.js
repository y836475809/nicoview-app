const { app } = require("electron");

class StartupConfig {
    constructor(base_dir){
        this._base_dir = base_dir;
    }

    load(){
        const name = app.commandLine.getSwitchValue("test");
        if(!name){
            throw new Error("--test has no value");
        }
        const startup_config = require("../../test/startup-config.json");
        this._params = startup_config[name];
        if(!this._params){
            throw new Error(`not find config name=${name}`);
        }
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
}

module.exports = {
    StartupConfig,
};