const https = require("https");
const querystring = require('querystring');
const user_agent = process.env["user_agent"];
const timeout_msec = 10*1000;

class NicoLoginRequest {
    constructor(expire_margin_src=60){
        this._cookie = null;
        this._expire_margin_src = expire_margin_src;
    }

    cancel(){
        if(!this._req){
            return;
        }

        const error = new Error("cancel");
        error.cancel = true;
        this._req.destroy(error);
    } 

    isAlreadyLogin(){
        return this._cookie !== null;
    }

    isExpired(){
        if(!this.isAlreadyLogin()){
            return false;
        }

        const cu_date = new Date();
        const diff_sec = (this.max_date - cu_date) / 1000;
        return diff_sec > this._expire_margin_src;
    }

    getCookie(){
        return this._cookie;
    }

    _getLoginCookie(cookies){
        return cookies.find(cookie => cookie.startsWith("user_session=user_session"));
    }

    _hasLoginCookie(cookies){
        return this._getLoginCookie(cookies);
    }

    _getCookieVal(cookie, key){
        return ((cookie + ';').match(key + '=([^¥S;]*)')||[])[1];
    }

    _setCookies(cookies){
        this._cookie = this._getLoginCookie(cookies);

        // sec
        const max_age = parseInt(this._getCookieVal(this._cookie, "Max-Age"));
        this.max_date = new Date();
        this.max_date.setSeconds(this.max_date.getSeconds() + max_age);
    }

    login(username, password){
        const url = new URL("https://secure.nicovideo.jp/secure/login?site=niconico");
        const headers = {
            "user-agent": user_agent,
        };
        const options = {
            hostname: url.hostname,
            port: 443,
            path: `${url.pathname}${url.search}`,
            method: "POST",
            headers:headers,
        }; 

        const post_data = querystring.stringify({
            "mail_tel" : username,
            "password" : password
        });
        options.headers["Content-Type"] =  'application/x-www-form-urlencoded';
        options.headers["Content-Length"] = post_data.length;   

        return new Promise((resolve, reject) => {
            this._req = https.request(options, (res) => {
                if(res.statusCode < 200 || res.statusCode > 303){
                    const error = new Error(`${res.statusCode}: ${url.toString()}`);
                    error.status = res.statusCode;
                    reject(error);
                    return;
                }

                const cookies = res.headers["set-cookie"];
                if(!this._hasLoginCookie(cookies)){
                    reject(new Error(`not find cookie : ${url.toString()}`));
                    return;
                }
                this._setCookies(cookies);
                resolve(); 
            });

            this._req.on("error", (e) => {
                reject(e);
            });
            this._req.on("timeout", () => {
                this._req.destroy(new Error(`timeout : ${url.toString()}`));
            });

            this._req.setTimeout(timeout_msec);
            this._req.write(post_data);
            this._req.end();
        });
    }

    logout(){
        const url = new URL("https://secure.nicovideo.jp/secure/logout?site=niconico");
        const cookie = this.getCookie();
        const headers = {
            "user-agent": user_agent,
            "Cookie" :cookie?cookie:""
        };
        const options = {
            hostname: url.hostname,
            port: 443,
            path: `${url.pathname}${url.search}`,
            method: "GET",
            headers:headers,
        }; 
        return new Promise((resolve, reject) => {
            this._req = https.request(options, (res) => {
                if(res.statusCode < 200 || res.statusCode > 303){
                    const error = new Error(`${res.statusCode}: ${url.toString()}`);
                    error.status = res.statusCode;
                    reject(error);
                    return;
                }

                this._cookie = null;
                resolve();
            });

            this._req.on("error", (e) => {
                reject(e);
            });
            this._req.on("timeout", () => {
                this._req.destroy(new Error(`timeout : ${url.toString()}`));
            });

            this._req.setTimeout(timeout_msec);
            this._req.end();
        });
    }    
}

module.exports = {
    NicoLoginRequest,
};
