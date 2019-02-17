const fs = require("fs");
// var zlib = require('zlib');
const url = require("url");
var path = require('path');
let cache = {};

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

const s = "https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/158/1582258.jpg?1313765172";
const u = url.parse(s);
console.log(u.pathname);
const pathname  = u.pathname;
console.log(path.extname(u.pathname));
// pathname.endsWith(".jpg");
// pathname.endsWith(".jpeg");
// pathname.endsWith(".png");
// pathname.endsWith(".gif");

const Dexie = require("dexie");

var db = new Dexie('mydb');
db.version(1).stores({foo: 'id'});

db.foo.put({id: 1, bar: 'hello rollup'}).then(id => {
    return db.foo.get(id);
}).then (item => {
    alert ("Found: " + item.bar);
}).catch (err => {
    alert ("Error: " + (err.stack || err));
});

class ImagseCache(){
    
}
