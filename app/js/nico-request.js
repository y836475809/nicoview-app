const request = require("request");

const getFromHeaders = (headers, target_key)=> {
    for (const key in headers) {
        if (key.toLowerCase() == target_key.toLowerCase()) {
            const value = headers[key];
            if (value instanceof Array){
                return value;
            }else{
                return [value];
            }
        }
    }
    throw new Error(`Can not get ${target_key} form headers`);
};

class NicoRequest {
    constructor(){
        this.canceled = false;
    }

    getCookie(headers, uri){
        const cookie_jar = request.jar();
        const cookie_headers = getFromHeaders(headers, "Set-Cookie");
        cookie_headers.forEach(value=>{
            cookie_jar.setCookie(value, uri);
        });
        return cookie_jar;
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