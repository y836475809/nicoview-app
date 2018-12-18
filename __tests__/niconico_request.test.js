const nock = require("nock");
const rp = require("request-promise");
const request = require("request");

const url = "https://test.com";
const path = "/api/v2/items";


test("http req", () => {
    nock(url).get(path).reply(200, {
        "response": "Hello, World!"
    });

    const cookieJar = request.jar();
    const options = {
        uri: `${url}${path}`,
        method: "GET",
        jar: cookieJar,
        timeout: 10 * 1000
    };
    const req = rp(options);
    req.then((body) => {
        console.log("body=", body);
    }).catch((error)=>{
        throw error;
    });
});