const { NicoClientRequest, NicoCookie } = require("./nico-client-request");
const myapi = require("./my-api");

const get_cookie = async () => {
    const cookie = await myapi.ipc.NicoCookie.get();
    return cookie;
};

/**
 * 
 * @param {String} longin_id 
 * @param {String} login_pw 
 */
const login = async(longin_id, login_pw) => {
    const url = new URL("https://account.nicovideo.jp/login/redirector");
    let auth_id = "";
    for (let index = 0; index < 10; index++) {
        auth_id += String(Math.trunc(Math.random()*10));
    }
    const post_data = {
        "mail_tel" : longin_id,
        "password" : login_pw,
        "auth_id": auth_id
    };
    const req = new NicoClientRequest();
    const cookies = await req.login(url, post_data);
    const nicosid = NicoCookie.getValue(cookies, "nicosid");
    const user_session = NicoCookie.getValue(cookies, "user_session");
    let err_msg = "";
    if(nicosid === null){
        err_msg = err_msg + "nicosid,";
    }
    if(user_session === null){
        err_msg = err_msg + "user_session,";
    }
    if(err_msg != ""){
        throw new Error("Could not find:" + err_msg);
    }
    return `nicosid=${nicosid}; user_session=${user_session}`;
};

const logout = async() => {
    const url = new URL("https://account.nicovideo.jp/logout");
    const cookie = await get_cookie();
    const req = new NicoClientRequest();
    await req.logout(url, cookie);
};

module.exports = {
    get_cookie,
    login,
    logout,
};