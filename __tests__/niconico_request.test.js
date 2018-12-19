const nock = require("nock");
const { NicoNico, NicoCommnet } = require("../test/test-client");
var request = require('request');
const express = require("express");
const fs = require("fs");
// test("http req", async () => {
//     // jest.setTimeout(20000);
//     nock("http://www.nicovideo.jp")
//         .get("/watch/sm19961784")
//         // .delay(12000)
//         .replyWithFile(200, `${__dirname}/data/sm19961784.html`, { "Content-Type": "html/text" });

//     const niconico = new NicoNico();
//     const data = await niconico.watch("sm19961784");
//     console.log(data);
//     // niconico.watch("sm19961784").then(b=>{
//     //     console.log(b);
//     // });
// });


test("http req cancel", () => {
    jest.setTimeout(20000);
    
    const app = express();
    // app.use(express.static('dest'));
    const port = 8084;
    // app.listen(port, ()=> {
    //     console.log("Expressサーバー起動");
    // });
    // app.get("/watch/sm19961784", (req, res)=>{
    //     // res.send('hello world');
        
    //     setTimeout(()=>{
    //         const file = fs.readFileSync(`${__dirname}/data/sm19961784.html`, "utf-8");
    //         res.writeHead(200, {"Content-Type" : "text/html"});
    //         res.write(file);
    //         res.end();
    //     }, 5*1000);

    // });
    // const server = app.listen(port, ()=> {
    //     console.log("Expressサーバー起動");
    // });
    // app.listen(port);


    
    // // nock.cleanAll();
    // nock.disableNetConnect();
    // nock.enableNetConnect('localhost:8084');
    // nock.disableNetConnect();
    // Allow localhost connections so we can test local routes and mock servers.
    // nock.enableNetConnect('127.0.0.1');
    // nock.enableNetConnect('127.0.0.1');
    nock("http://127.0.0.1:8084")
        .get("/watch/sm19961784")
        .delay(3000)
        .reply(200, "ok");
        // .replyWithFile(200, `${__dirname}/data/sm19961784.html`, { "Content-Type": "html/text" });

    // const niconico = new NicoNico("http://localhost:8084");
    // niconico.watch("sm19961784").then(b=>{
    //     console.log("done: ", b);
    // }).catch((error)=>{
    //     // console.log("error");
    //     console.log("error:", error);
    // });
    function doRequest(options) {
        return new Promise((resolve, reject) => {
            request(options, (error, res, body) => {
                if (!error && res.statusCode == 200) {
                    resolve(body);
                } else {
                    reject(error);
                }
            });
        });
    }

    const options = {
        url: `http://127.0.0.1:${port}/watch/sm19961784`,
        method: 'GET',
        timeout: 20*1000
    };
    // const hoge = async () =>{
    //     const res = await doRequest(options);
    //     console.log("rr=", res);
    // };
    // hoge();
    // const rr = await doRequest(options);
    // console.log("rr=", rr);
    // // var req = http.get('http://www.dummy.nicovideo.jp/watch/sm19961784');
    // request(`http://localhost:${port}/watch/sm19961784`, (err, response, body) => {
    request(options, (err, response, body) => {
        
        console.log(body);
        console.log("body");
        // server.close();
    }); 
    // niconico.cancel();
    // niconico.watch("sm19961784").then(b=>{
    //     return niconico.postDmcSession()
    // });
    // console.log("cancel");
    // p.abort();
    // setTimeout(()=>{
    //     console.log("cancel");
    //     niconico.cancel();
    // }, 500);
    // try {
    //     const data = await niconico.watch("sm19961784");
    //     console.log(data);    
    // } catch (error) {
    //     console.log(error);    
    // }



});
