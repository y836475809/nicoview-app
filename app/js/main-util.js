
class CmdLineParser {
    /**
     * 
     * @param {Array.<String>} argv 
     */
    constructor(argv){
        this._opt_map = new Map();
        for (let i = 0; i < argv.length; i++) {
            const arg = argv[i];
            if(arg.startsWith("--") !== true){
                continue;
            }
            if(i+1<argv.length && argv[i+1].startsWith("--") !== true){
                const value = argv[i+1];
                this._opt_map.set(arg, value);
                i++;
            }else{
                this._opt_map.set(arg, true);
            }
        }
    }
    
    get(key, default_value){
        if(this._opt_map.has(key)){
            return this._opt_map.get(key);
        }
        return default_value;
    }
}

module.exports = {
    CmdLineParser
};