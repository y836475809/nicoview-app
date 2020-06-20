const { CmdLineParser } = require("./js/cmd-line-parser");

class StartupConfig {
    constructor(base_dir, argv){
        this._base_dir = base_dir;
        this._cmdline_parser = new CmdLineParser(argv);
    }

    load(){
        const name = this._cmdline_parser.get("--name", "");
        if(name){
            const startup_config = require("../test/startup-config.json");
            this._params = startup_config[name];
            if(!this._params){
                throw new Error(`not find config name=${name}`);
            } 
            this._params["debug"] = this._cmdline_parser.get("--debug", false);
            if(this._params["use_mock_server"]){
                this._params["mock_server_port"] = startup_config["mock_server_port"];
                this._params["mock_server_wait_msec"] = startup_config["mock_server_wait_msec"];
            }
        }else{
            this._params = {
                debug: false,
                use_mock_server:false,
                main: "app/html/index.html",
                config_fiiename: "config.json",
                window_frame: false
            };
        }
    }

    get debug(){
        return this._params["debug"];
    }

    get main_html_path(){
        return `${this._base_dir}/${this._params["main"]}`;
    }

    get player_html_path(){
        return `${this._base_dir}/app/html/player.html`;
    }

    get preload_main_path(){
        return `${this._base_dir}/app/preload_main.js`;
    }

    get preload_player_path(){
        return `${this._base_dir}/app/preload_player.js`;
    }

    get config_fiiename(){
        return this._params["config_fiiename"];
    }

    get window_frame(){
        return this._params["window_frame"];
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