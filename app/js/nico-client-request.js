const https = require("https");

const user_agent = process.env["user_agent"];
const proxy_server = process.env["proxy_server"];
const timeout_msec = 120*1000;

const getValue = (headers, key) => {
    for (const prop in headers) {
        if(prop.toLowerCase() == key.toLowerCase()){
            return headers[prop];
        }
    }  
    return null;
};

class NicoCookie {
    /**
     * 
     * @param {Array} headers 
     */
    constructor(url, headers){
        this._url = new URL(url);
        this._keys = ["nicohistory", "nicosid"];
        this._cookie_headers = getValue(headers, "set-cookie");
    }

    getCookieHeaders(){
        if(!this._cookie_headers){
            throw new Error(`nico cookie headers is ${this._cookie_headers}`);
        }
        if (!Array.isArray(this._cookie_headers)) {
            throw new Error(`nico cookie headers is not array`);
        }

        return this._cookie_headers.filter(value => {
            return this._keys.some(key => value.includes(key));
        });
    }

    getSesstionCookies(){
        const sc = [];
        const objs = this._parse(this.getCookieHeaders());
        objs.forEach(value => {
            for (let index = 0; index < this._keys.length; index++) {
                const key = this._keys[index];
                if(Object.prototype.hasOwnProperty.call(value, key)===true){
                    // cookie.expires
                    sc.push({
                        url: this._url.origin,
                        name: key,
                        value: value[key],
                        domain: value.domain,
                        path: value.path,
                        secure: value.secure==undefined?false:true
                    }); 
                }
            }
        });
        return sc;
    }

    _parse(cookies){
        const objs = [];
        cookies.forEach(value => {
            const obj = {};
            value.split(";").forEach(( cookie ) => {
                const parts = cookie.split("=");
                obj[parts[0].trim()] = parts[1].trim();
            });
            objs.push(obj);
        });
        return objs;
    }
}

class NicoClientRequest {
    get(url, {nico_cookie=null, stream=null, on_progress=null, encoding="utf8"}={}){
        this._resetParams();
 
        this._stream = stream;
        this._on_progress = on_progress;
        this._timeout_msec = timeout_msec;
        this._encoding = encoding;

        const options = this._getOptions(url, "GET");
        if(nico_cookie){
            options.headers["Cookie"] = nico_cookie.getCookieHeaders();
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

    getNicoCookie(){
        return this._res_nico_cookie;
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
        this._res_nico_cookie = null;
        this._on_progress = null;
        this._res_json = false;
    }

    _getOptions(url, method){
        const headers = {
            "user-agent": user_agent
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

    _request(url, options, set_data_func=(req)=>{}){
        return new Promise((resolve, reject) => {
            let str_data = "";
            let binary_data = [];
            const is_binary = this._encoding == "binary";

            let current = 0 ;
            let content_len = 0;

            this._req = https.request(options, (res) => {
                // console.log('STATUS: ' + res.statusCode);
                // console.log('HEADERS: ' + JSON.stringify(res.headers));

                if(!this._validateStatus(res.statusCode)){
                    const status_error = new Error(`${res.statusCode}: ${url}`);
                    status_error.status = res.statusCode;
                    reject(status_error);
                    return;
                }

                content_len = parseInt(getValue(res.headers, "content-length"));
                if(isNaN(content_len)){
                    content_len = 0;
                }

                res.setEncoding(this._encoding);
                this._res_nico_cookie = new NicoCookie(url, res.headers);
               
                if(this._stream){
                    res.pipe(this._stream);
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
                }else{
                    res.on("data", (chunk) => {
                        if(is_binary===true){
                            binary_data.push(Buffer.from(chunk, "binary"));
                        }else{
                            str_data += chunk;
                        }
                    });
                    res.on("end", () => {
                        if(is_binary===true){
                            resolve(Buffer.concat(binary_data));
                        }else{
                            if(this._res_json===true){
                                try {
                                    const json_data = JSON.parse(str_data);
                                    resolve(json_data);
                                } catch (error) {
                                    error.message = `response json parse error:${error.message},url=${url},`;
                                    reject(error);
                                }   
                            }else{
                                resolve(str_data);
                            }
                        }    
                    });
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
}

module.exports = {
    NicoCookie,
    NicoClientRequest,
};
