const fs = require("fs");
// var zlib = require('zlib');
const url = require("url");
var path = require('path');
let cache = {};
var Datastore = require('nedb');

//https://github.com/dfahlander/Dexie.js/issues/582

const key1 = "./__tests__/tmp/sample.jpeg";
const key2 = "./__tests__/tmp/sample2.jpeg";

const dataTypeMap = new Map([
    [".jpg", "data:image/jpeg;base64,"], 
    [".jpeg", "data:image/jpeg;base64,"], 
    [".png", "data:image/png;base64,"], 
    [".gif", "data:image/gif;base64,"], 
]);
 
const gettype = (url) => {
    const u = url.parse(s);
    const pathname  = u.pathname.toLowerCase();
    const ext = path.extname(u.pathname);
    if(dataTypeMap.has(ext)){
        throw new Error(`cant get type: ${pathname}`);
    }
    return dataTypeMap.get(ext);    
};
// cache[key1] = fs.readFileSync(key1, "base64");
// cache[key2] = fs.readFileSync(key2, "base64");

// const dist = "./__tests__/tmp/xxx.ch";
// // JSON.stringify
// // fs.writeFile(dist, JSON.stringify(cache), function(err) {
// //     console.log(err);
// // });
// const re_cache = JSON.parse(fs.readFileSync(dist, "utf8"));
// console.log(re_cache[key1]);

// const s = "https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/158/1582258.jpg?1313765172";
// const u = url.parse(s);
// console.log(u.pathname);
// const pathname  = u.pathname;
// console.log(path.extname(u.pathname));
// // pathname.endsWith(".jpg");
// // pathname.endsWith(".jpeg");
// // pathname.endsWith(".png");
// // pathname.endsWith(".gif");

// const Dexie = require("dexie");

// var db = new Dexie('mydb');
// db.version(1).stores({foo: 'id'});

// db.foo.put({id: 1, bar: 'hello rollup'}).then(id => {
//     return db.foo.get(id);
// }).then (item => {
//     alert ("Found: " + item.bar);
// }).catch (err => {
//     alert ("Error: " + (err.stack || err));
// });

class ImageCache {
    constructor(){
        this.db = new Datastore({ 
            filename: "test2.db",
            autoload: true
        });      
    }
    
    _gettype(_url, base64_data){
        const u = url.parse(_url);
        const pathname  = u.pathname.toLowerCase();
        const ext = path.extname(u.pathname);
        if(dataTypeMap.has(ext)){
            throw new Error(`cant get type: ${pathname}`);
        }
        return `${dataTypeMap.get(ext)}${base64_data}`;
    }

    getImageBase64(_url){
        return new Promise((resolve, reject) => {
            const options = { method: "GET", url: _url, encoding: null };
            request(options, (error, response, body) => {
                if (!error && response.statusCode === 200) {
                    // const deflated = zlib.deflateSync(body).toString("base64");
                    // var inflated = zlib.inflateSync(new Buffer(deflated, 'base64')).toString();
                    const data = new Buffer.from(body).toString("base64");
                    // const doc = {
                    //     url: url,
                    //     // data: new Buffer(body).toString("base64");
                    //     data: data
                    // };          
                    resolve(data);
                } else {
                    reject(new Error("cant get"));
                }
            });
        });
    }

    getSrc(_url){
        return new Promise((resolve, reject) => {
            db.find({ url: _url }, async (err, docs) => {
                if(err){
                    reject(err);
                    return;
                }
                if(docs.length==0){
                    try {
                        const data = await this.getImageBase64(_url);
                        const doc = {
                            url: _url,
                            data: data
                        };  
                        db.insert(doc);
                        resolve(this._gettype(_url, data));
                    } catch (error) {
                        resolve(_url);
                    }
                }else{
                    const base64_data = docs[0].data;
                    resolve(this._gettype(_url, base64_data));
                }
            });   
        });    
    }
}

var request = require('request');
var zlib = require('zlib');

const db = new Datastore({ 
    filename: "test2.db",
    autoload: true
});

// const doc = {
//     name: "test",
//     doc:"test1"
// };
// db.insert(doc);
const u = "https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/defaults/blank_s.jpg";


// db.find({ url: "dummy" }, (err, docs) => {
//     console.log("url=", u);
//     console.log("err=", err);
//     console.log("docs=", docs);
// });

// request(
//     { method: "GET", url: u, encoding: null },
//     (error, response, body) => {
//         if (!error && response.statusCode === 200) {

//             const deflated = zlib.deflateSync(body).toString("base64");
//             // var inflated = zlib.inflateSync(new Buffer(deflated, 'base64')).toString();

//             const doc = {
//                 url: u,
//                 // data: new Buffer(body).toString("base64");
//                 data: deflated
//             };
//             db.insert(doc);
//         }
//     }
// );

db.find({ url: u }, (err, docs) => {
    const deflated = docs[0].data;
    // const inflated = zlib.inflateSync(new Buffer.from(deflated, "base64")).toString();
    const inflated = zlib.inflateSync(new Buffer.from(deflated, "base64")).toString("base64");
    console.log("url=", u);
    console.log("err=", err);
    console.log("inflated=", inflated);
});

// request(
//     { method: "GET", url: u, encoding: null },
//     (error, response, body) => {
//         if (!error && response.statusCode === 200) {
//             const doc = {
//                 url: u,
//                 // data: new Buffer(body).toString("base64");
//                 data: new Buffer.from(body).toString("base64");
//             };
//             db.insert(doc);
//         }
//     }
// );

