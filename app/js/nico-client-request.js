const https = require("https");

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
        this.url = new URL(url);
        this.keys = ["nicohistory", "nicosid"];
        this.cookie_headers = getValue(headers, "set-cookie");
    }

    getCookieHeaders(){
        if(!this.cookie_headers){
            throw new Error(`nico cookie headers is ${this.cookie_headers}`);
        }
        if (!Array.isArray(this.cookie_headers)) {
            throw new Error(`nico cookie headers is not array`);
        }

        return this.cookie_headers.filter(value => {
            return this.keys.some(key => value.includes(key));
        });
    }

    getSesstionCookies(){
        const sc = [];
        const objs = this._parse(this.getCookieHeaders());
        objs.forEach(value => {
            for (let index = 0; index < this.keys.length; index++) {
                const key = this.keys[index];
                if(value.hasOwnProperty(key)===true){
                    // cookie.expires
                    sc.push({
                        url: this.url.origin,
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
    get(url, {nico_cookie=null, stream=null, on_progress=null, timeout_msec=10*1000, encoding="utf8"}={}){
        this._resetParams();
 
        this.stream = stream;
        this.on_progress = on_progress;
        this.timeout_msec = timeout_msec;
        this.encoding = encoding;

        const options = this._getOptions(url, "GET");
        if(nico_cookie){
            options["headers"] = {
                "Cookie": nico_cookie.getCookieHeaders()
            };
        }

        return this._request(url, options);
    }

    post(url, {json=null, timeout_msec=10*1000}={}){
        this._resetParams();

        this.timeout_msec = timeout_msec;

        if(!json){
            throw new Error(`post: json=${json}`);
        }
        this.stream = null;

        const options = this._getOptions(url, "POST");
        options.headers = { "content-type": "application/json" };

        return this._request(url, options, (req)=>{
            req.write(JSON.stringify(json));
        });
    }

    options(url, {json=null, timeout_msec=10*1000}={}){
        this._resetParams();

        this.timeout_msec = timeout_msec;

        if(!json){
            throw new Error(`options: json=${json}`);
        }
        this.stream = null;
        const options = this._getOptions(url, "OPTIONS");

        return this._request(url, options, (req)=>{
            req.write(JSON.stringify(json));
        });
    }

    getNicoCookie(){
        return this.res_nico_cookie;
    }

    cancel(){
        const error = new Error("cancel");
        error.cancel = true;
        this.req.destroy(error);
    } 

    _resetParams(){
        this.encoding = "utf8";
        this.stream = null;
        this.res_nico_cookie = null;
        this.on_progress = null;
    }

    _getOptions(url, method){
        const _url = new URL(url);
        return {
            hostname: _url.hostname,
            port: 443,
            path: `${_url.pathname}${_url.search}`,
            method: method,
        };   
    }

    _validateStatus(status_code) {
        return status_code >= 200 && status_code < 300;
    }

    _request(url, options, set_data_func=(req)=>{}){
        return new Promise((resolve, reject) => {
            let str_data = "";
            let binary_data = [];
            const is_binary = this.encoding == "binary";

            let current = 0 ;
            let content_len = 0;

            this.req = https.request(options, (res) => {
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

                res.setEncoding(this.encoding);
                this.res_nico_cookie = new NicoCookie(url, res.headers);
               
                if(this.stream){
                    res.pipe(this.stream);
                    if(this.on_progress){
                        res.on("data", (chunk) => {
                            if(content_len === 0){
                                return;
                            }
                            
                            const pre_per = Math.floor((current/content_len)*100);
                            current += chunk.length;
                            const cur_per = Math.floor((current/content_len)*100);
                            if(cur_per > pre_per){
                                this.on_progress(current, content_len);
                            }
                        });
                    }
                    res.on("end", () => {
                        resolve();
                    });
                    this.stream.on("error", (error) => { 
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
                            resolve(str_data);
                        }    
                    });
                }
            });

            this.req.on("error", (e) => {
                if(this.stream){
                    this.stream.destroy();
                }

                reject(e);
            });
            this.req.on("timeout", () => {
                this.req.destroy(new Error(`timeout : ${url}`));
            });

            this.req.setTimeout(this.timeout_msec);
            set_data_func(this.req);
            
            this.req.end();
        });
    }
}

module.exports = {
    NicoCookie,
    NicoClientRequest,
};
