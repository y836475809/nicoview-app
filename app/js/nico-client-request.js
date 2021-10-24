const https = require("https");
const zlib = require("zlib");

const user_agent = process.env["user_agent"];
const proxy_server = process.env["proxy_server"];
const timeout_msec = 120*1000;

class NicoCookie {
    /**
     * 
     * @param {Array<String>} cookies 
     * @param {String} name 
     */
    static getValue(cookies, name){
        let value = null;
        cookies.some(c=>{
            const ret = new RegExp(name + "=[^;]+").exec(c);
            if(ret){
                value = ret[0].replace(name + "=", "");
                return true;
            }
        });
        return value;
    }

    /**
     * 
     * @param {Object} json_obj 
     */
    static getHeader(json_obj) {
        let header = "";
        Object.keys(json_obj).forEach(key => {
            header += `${key}=${json_obj[key]}; `;
        });
        return header.slice(0, -2);
    }
}

const getValue = (headers, key) => {
    for (const prop in headers) {
        if(prop.toLowerCase() == key.toLowerCase()){
            return headers[prop];
        }
    }  
    return null;
};

class NicoClientRequest {
    get(url, {cookie=null, stream=null, on_progress=null, encoding="utf8"}={}){
        this._resetParams();
 
        this._stream = stream;
        this._on_progress = on_progress;
        this._timeout_msec = timeout_msec;
        this._encoding = encoding;

        const options = this._getOptions(url, "GET");
        if(cookie){
            options.headers["Cookie"] = cookie;
        }

        return this._request(url, options);
    }

    post(url, {json=null}={}){
        this._resetParams();

        this._timeout_msec = timeout_msec;

        if(!json){
            throw new Error(`post: json=${json}`);
        }

        const json_str = JSON.stringify(json);
        const options = this._getOptions(url, "POST");
        options.headers["Content-Type"] = "application/json";
        options.headers["Content-Length"] = json_str.length;

        this._res_json = true;

        return this._request(url, options, (req)=>{
            req.write(json_str);
        });
    }

    options(url){
        this._resetParams();

        this._timeout_msec = timeout_msec;

        const options = this._getOptions(url, "OPTIONS");

        return this._request(url, options);
    }

    cancel(){
        if(!this._req){
            return;
        }

        const error = new Error("cancel");
        error.cancel = true;
        this._req.destroy(error);
    } 

    _resetParams(){
        this._encoding = "utf8";
        this._stream = null;
        this._on_progress = null;
        this._res_json = false;
    }

    _getOptions(url, method){
        const headers = {
            "user-agent": user_agent,
            "accept-encoding": "gzip",
        };

        if(proxy_server){
            const proxy_url = new URL(proxy_server);
            return {
                hostname: proxy_url.hostname,
                port: proxy_url.port,
                path: url,
                method: method,
                headers:headers
            }; 
        }

        const _url = new URL(url);
        return {
            hostname: _url.hostname,
            port: 443,
            path: `${_url.pathname}${_url.search}`,
            method: method,
            headers:headers
        };   
    }

    _validateStatus(status_code) {
        return status_code >= 200 && status_code < 300;
    }

    _request(url, options, set_data_func=(req)=>{}){ // eslint-disable-line no-unused-vars
        return new Promise((resolve, reject) => {
            this._req = https.request(options, (res) => {
                // console.log('STATUS: ' + res.statusCode);
                // console.log('HEADERS: ' + JSON.stringify(res.headers));
                this.set_cookie = res.headers["set-cookie"];

                if(!this._validateStatus(res.statusCode)){
                    const status_error = new Error(`${res.statusCode}: ${url}`);
                    status_error.status = res.statusCode;
                    reject(status_error);
                    return;
                }

                let content_encoding = res.headers["content-encoding"];
                if(!content_encoding){
                    content_encoding = "";
                    res.setEncoding(this._encoding);
                }
               
                if(this._stream){
                    if(this._isgzip(res)){
                        const gzip = zlib.createGunzip();
                        res.pipe(gzip).pipe(this._stream);
                        this._resStreamData(gzip, resolve, reject);
                    }else{
                        res.pipe(this._stream);
                        this._resStreamData(res, resolve, reject);
                    } 
                }else{
                    const isgzip = this._isgzip(res);
                    if(this._isgzip(res)){
                        const gzip = zlib.createGunzip();
                        res.pipe(gzip);
                        this._resData(gzip, url, isgzip, resolve, reject);
                    }else{
                        this._resData(res, url, isgzip, resolve, reject);
                    }
                }
            });

            this._req.on("error", (e) => {
                if(this._stream){
                    this._stream.destroy();
                }

                reject(e);
            });
            this._req.on("timeout", () => {
                this._req.destroy(new Error(`timeout : ${url}`));
            });

            this._req.setTimeout(this._timeout_msec);
            set_data_func(this._req);
            
            this._req.end();
        });
    }

    _isgzip(res){
        const content_encoding = res.headers["content-encoding"];
        if(!content_encoding){
            return false;
        }
        return content_encoding.includes("gzip");
    }

    _resStreamData(res, resolve, reject){
        let current = 0 ;
        let content_len = parseInt(getValue(res.headers, "content-length"));
        if(isNaN(content_len)){
            content_len = 0;
        }

        if(this._on_progress){
            res.on("data", (chunk) => {
                if(content_len === 0){
                    return;
                }
                
                const pre_per = Math.floor((current/content_len)*100);
                current += chunk.length;
                const cur_per = Math.floor((current/content_len)*100);
                if(cur_per > pre_per){
                    this._on_progress(current, content_len);
                }
            });
        }
        res.on("end", () => {
            resolve();
        });
        this._stream.on("error", (error) => { 
            reject(error);
        });
    }

    _resData(res, url, isgzip, resolve, reject){
        const is_binary = this._encoding == "binary";
        let str_data = "";
        let binary_data = [];

        res.on("data", (chunk) => {
            if(is_binary || isgzip){
                binary_data.push(Buffer.from(chunk, "binary"));
            }else{
                str_data += chunk;
            }
        });
        res.on("end", () => {
            if(is_binary){
                resolve(Buffer.concat(binary_data));
            }else{
                let data = "";
                try {
                    if(isgzip){
                        data = (new TextDecoder).decode(
                            Uint8Array.from(Buffer.concat(binary_data)));
                    }else{
                        data = str_data;
                    }
                } catch (error) {
                    error.message = `response data decode error:${error.message},isgzip=${isgzip},url=${url},`;
                    reject(error);
                }   
                if(this._res_json){
                    try {
                        const json_data = JSON.parse(data);
                        resolve(json_data);
                    } catch (error) {
                        error.message = `response json parse error:${error.message},url=${url},`;
                        reject(error);
                    }   
                }else{
                    resolve(data);
                }
            }    
        });  
    }
}

module.exports = {
    NicoClientRequest,
    NicoCookie,
};
