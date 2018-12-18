const nock = require("nock");
const { NicoNico, NicoCommnet } = require("../test/test-client");


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


test("http req cancel", async () => {
    // jest.setTimeout(20000);
    nock("http://www.nicovideo.jp")
        .get("/watch/sm19961784")
        .delay(2000)
        .replyWithFile(200, `${__dirname}/data/sm19961784.html`, { "Content-Type": "html/text" });

    const niconico = new NicoNico();
    niconico.watch("sm19961784").then(b=>{
        console.log("done");
    });
    niconico.watch("sm19961784").then(b=>{
        return niconico.postDmcSession()
    });
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
