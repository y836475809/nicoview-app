const request = require("request");

class NicoRequest {
    constructor(){
        this.canceled = false;
    }

    _cancel(){
        this.canceled = true;
    }

    _validateStatus(status) {
        return status >= 200 && status < 300;
    }

    _reuqest(options, cb){
        this.canceled = false;
        return request(options, (error, res, body) => {
            if(error){
                cb(error, null, null);
            }else if(this._validateStatus(res.statusCode)){
                try {
                    cb(null, res, body);
                } catch (error) {
                    cb(error, null, null);
                }
            }else{
                const error = new Error(`${res.statusCode}: ${options.uri}`);
                error.status = res.statusCode;
                cb(error, null, null); 
            }
        }).on("abort", () => {
            if(this.canceled){
                const error = new Error("cancel");
                error.cancel = true;
                cb(error, null, null);
            } 
        });
    }
}

module.exports = {
    NicoRequest: NicoRequest
};