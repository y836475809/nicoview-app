const test = require("ava");
const nock = require("nock");
const sinon = require("sinon");
const { NicoLoginRequest } = require("../app/js/nico-login");

const max_age_sec = 2591999;

const cookies = [
    'nicosid=12345.12345; expires=Mon, 31-Mar-3021 00:00:00 GMT; Max-Age=315360000; path=/; domain=.nicovideo.jp',
    'user_session=deleted; Max-Age=0; Expires=Fri, 02 Apr 3041 00:00:00 GMT; Path=/',
    `user_session=user_session_12345; Max-Age=${max_age_sec}; Expires=Sun, 02 May 3021 00:00:00 GMT; Path=/; Domain=.nicovideo.jp`,
    `user_session_secure=AAAAA; Max-Age=${max_age_sec}; Expires=Sun, 02 May 3021 00:00:00 GMT; Path=/; Domain=.nicovideo.jp; Secure; HTTPOnly`,       
    'registrationActionTrackId=; Max-Age=0; Expires=Fri, 02 Apr 3021 00:00:00 GMT; Path=/; Domain=.nicovideo.jp; Secure; HTTPOnly',
    'nicosid=12345.12345; Max-Age=315360000; Expires=Mon, 31 Mar 3031 00:00:00 GMT; Path=/; Domain=.nicovideo.jp'
];

const nock_login = ({delay=1, code=302} = {}) => {
    nock("https://secure.nicovideo.jp")
        .post("/secure/login?site=niconico")
        .delay(delay)
        .reply((uri, body)=>{
            if(body=="mail_tel=mail&password=pass"){
                return [code, "", {
                    "Set-Cookie": cookies
                }];
            }else{
                return [code, "", {
                    "Set-Cookie": [
                        'nicosid=12345.12345; expires=Mon, 31-Mar-2021 00:00:00 GMT; Max-Age=315360000; path=/; domain=.nicovideo.jp',
                        'nicosid=12345.12345; Max-Age=315360000; Expires=Mon, 31 Mar 2031 00:00:00 GMT; Path=/; Domain=.nicovideo.jp'
                    ]
                }];
            }
        });
};

const nock_logout = ({delay=1, code=302} = {}) => {
    nock("https://secure.nicovideo.jp")
        .get("/secure/logout?site=niconico")
        .delay(delay)
        .reply((uri, body)=>{ // eslint-disable-line no-unused-vars
            return [code, "", {
                "Set-Cookie": [
                    'user_session=deleted; Max-Age=-12345; Expires=Wed, 1 Mar 1987 01:01:01 GMT; Path=/',
                    'user_session=deleted; Max-Age=-12345; Expires=Wed, 1 Mar 1987 01:01:01 GMT; Path=/; Domain=.nicovideo.jp',
                    'user_session_secure=deleted; Max-Age=-12345; Expires=Wed, 1 Mar 1987 01:01:01 GMT; Path=/; Domain=.nicovideo.jp; Secure; HTTPOnly',
                ]
            }];
        });
};

test.before(t => { // eslint-disable-line no-unused-vars
    process.env["http_proxy"]="";
    process.env["https_proxy"]="";
    process.env["no_proxy"]="";
    
    nock.disableNetConnect();
});

test.after(t => { // eslint-disable-line no-unused-vars
});

test.beforeEach(t => { // eslint-disable-line no-unused-vars
    nock.cleanAll();
});

test.afterEach(t => { // eslint-disable-line no-unused-vars
    nock.cleanAll();
});

test("nico login isAlreadyLogin", (t) => {
    const req = new NicoLoginRequest();

    t.false(req.isAlreadyLogin());
    req._setCookies(cookies); 
    
    t.true(req.isAlreadyLogin());
});

test("nico login isExpired", (t) => {
    const req = new NicoLoginRequest();

    t.false(req.isExpired());
    req._setCookies(cookies); 
    t.true(req.isExpired());

    const clock = sinon.useFakeTimers(new Date().getTime());
    clock.tick(31*24*60*60*1000);
    t.false(req.isExpired());

    clock.restore();
});

test("nico login isExpired2", (t) => {
    const expire_margin_src = 10;
    const req = new NicoLoginRequest(expire_margin_src);

    req._setCookies(cookies); 

    let clock = sinon.useFakeTimers(new Date().getTime());

    clock.tick((max_age_sec-(expire_margin_src+5))*1000);
    t.true(req.isExpired());
    clock.restore();

    clock = sinon.useFakeTimers(new Date().getTime());
    clock.tick((max_age_sec-(expire_margin_src-5))*1000);
    t.false(req.isExpired());
    clock.restore();
});

test("nico login success", async (t) => {
    nock_login();

    const req = new NicoLoginRequest();

    t.false(req.isAlreadyLogin());
    t.false(req.isExpired());

    await req.login("mail", "pass");

    t.true(req.isAlreadyLogin());
    t.true(req.isExpired());
    t.regex(req.getCookie(), /^user_session=user_session/);
});

test("nico login fault pass", async (t) => {
    nock_login();

    const req = new NicoLoginRequest();

    t.false(req.isAlreadyLogin());
    t.false(req.isExpired());

    const error = await t.throwsAsync(req.login("mail", ""));
    t.regex(error.message, /not find cookie/);

    t.false(req.isAlreadyLogin());
    t.false(req.isExpired());
});

test("nico login page not find", async t => {
    nock_login({code:404});

    const req = new NicoLoginRequest();
    const error = await t.throwsAsync(req.login("mail", "pass"));
    t.is(error.cancel, undefined);
    t.is(error.name, "Error");
    t.regex(error.message, /404:/);

    t.false(req.isAlreadyLogin());
    t.false(req.isExpired());
});

test("nico login timetout", async (t) => {
    const mock_timeout = 121*1000;
    nock_login({delay:mock_timeout});

    const req = new NicoLoginRequest();
    const error = await t.throwsAsync(req.login("mail", "pass"));

    t.is(error.cancel, undefined);
    t.is(error.name, "Error");
    t.regex(error.message, /timeout/i);

    t.false(req.isAlreadyLogin());
    t.false(req.isExpired());
});

test.cb("nico login cancel", (t) => {
    t.plan(3);

    const mock_timeout = 2*1000;
    nock_login({delay:mock_timeout});

    const req = new NicoLoginRequest();

    setTimeout(()=>{
        req.cancel();
    }, 1000);

    req.login("mail", "pass").then().catch(error=>{
        t.true(error.cancel);
        t.false(req.isAlreadyLogin());
        t.false(req.isExpired());
        t.end();
    });
});

test("nico logout", async (t) => {
    nock_logout();

    const req = new NicoLoginRequest();
    req._setCookies(cookies); 
    t.true(req.isAlreadyLogin());
    t.true(req.isExpired());

    await req.logout();
    t.false(req.isAlreadyLogin());
    t.false(req.isExpired());
});