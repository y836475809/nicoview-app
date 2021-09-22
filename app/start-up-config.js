const { app } = require("electron");

class StartupConfig {
    constructor(base_dir){
        this._base_dir = base_dir;
    }

    load(){
        const name = this._getArg("name", "");
        if(name){
            const startup_config = require("../test/startup-config.json");
            this._params = startup_config[name];
            if(!this._params){
                throw new Error(`not find config name=${name}`);
            } 
            this._params["debug"] = this._getArg("debug", false);
            this._params["app_css"] = true;
            if(this._params["use_mock_server"]){
                this._params["mock_server_port"] = startup_config["mock_server_port"];
                this._params["mock_server_wait_msec"] = startup_config["mock_server_wait_msec"];
            }
        }else{
            const app_css = this._getArg("app_css", false);
            this._params = {
                debug: false,
                app_css: app_css,
                use_mock_server:false,
                main: "html/index.html",
                config_fiiename: "config.json"
            };
        }
    }
    
    _getArg(name, default_value){
        const value = app.commandLine.getSwitchValue(name);
        if(value!==undefined){
            if(typeof default_value === "boolean"){
                return value.toLowerCase() === "true";
            } 
            if(typeof default_value === "number"){
                return parseInt(value);
            }
            return value;
        }
        return default_value;
    }

    get debug(){
        return this._params["debug"];
    }

    get app_css(){
        return this._params["app_css"];
    }

    get main_html_path(){
        return `${this._base_dir}/${this._params["main"]}`;
    }

    get player_html_path(){
        return `${this._base_dir}/html/player.html`;
    }

    get preload_main_path(){
        return `${this._base_dir}/preload_main.js`;
    }

    get preload_player_path(){
        return `${this._base_dir}/preload_player.js`;
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
    StartupConfig,
};