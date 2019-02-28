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

    _reuqest(options, resolve, reject, cb){
        this.canceled = false;
        return request(options, (error, res, body) => {
            if(error){
                reject(error);
            }else if(this._validateStatus(res.statusCode)){
                try {
                    cb(res, body);
                } catch (error) {
                    reject(error); 
                }
            }else{
                const message = `${res.statusCode}: ${options.uri}`;
                reject(new Error(message)); 
            }
        }).on("abort", () => {
            if(this.canceled){
                const error = new Error("cancel");
                error.cancel = true;
                reject(error);
            } 
        });
    }
}

module.exports = {
    NicoRequest: NicoRequest
};