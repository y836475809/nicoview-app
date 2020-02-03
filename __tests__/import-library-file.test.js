const test = require("ava");
const path = require('path');
const { NicoXMLFile, NicoJsonFile } = require("../app/js/nico-data-file");

test("regx param", t => {
    // t.truthy(/sm\d+\.[mp4|flv|swf]/.test("sm10.mp4"));
    // t.truthy(/sm\d+\.[mp4|flv|swf]/.test("sm10.flv"));
    // t.truthy(/sm\d+\.[mp4|flv|swf]/.test("sm10.swf"));
    // t.falsy(/sm\d+\.[mp4|flv|swf]/.test("サンプル1 - [sm10].mp4"));
    // t.falsy(/sm\d+\.[mp4|flv|swf]/.test("サンプル1 - [sm10].flv"));
    // t.falsy(/sm\d+\.[mp4|flv|swf]/.test("サンプル1 - [sm10].swf"));

    // t.falsy(/\[sm\d+\]\.[mp4|flv|swf]/.test("sm10.mp4"));
    // t.falsy(/\[sm\d+\]\.[mp4|flv|swf]/.test("sm10.flv"));
    // t.falsy(/\[sm\d+\]\.[mp4|flv|swf]/.test("sm10.swf"));
    // t.truthy(/\[sm\d+\]\.[mp4|flv|swf]/.test("サンプル1 - [sm10].mp4")); 
    // t.truthy(/\[sm\d+\]\.[mp4|flv|swf]/.test("サンプル1 - [sm10].flv"));
    // t.truthy(/\[sm\d+\]\.[mp4|flv|swf]/.test("サンプル1 - [sm10].swf"));  
    const fname1 = "sm10.mp4"; 
    const fname2 = "サンプル1 - [sm10].mp4";

    const m1 = /(sm\d+)\.(mp4|flv|swf)/.exec(fname1);
    console.log(m1)
    t.is(m1[1], "sm10");
    t.is(path.basename(fname1, path.extname(fname1)), "sm10");
    const m2 = /(sm\d+)\.(mp4|flv|swf)/.exec(fname2);
    t.is(m2, null);

    const m3 = /\[(sm\d+)\]\.(mp4|flv|swf)/.exec(fname1);
    t.is(m3, null);
    const m4 = /\[(sm\d+)\]\.(mp4|flv|swf)/.exec(fname2);
    t.is(m4[1], "sm10");
    t.is(path.basename(fname2, path.extname(fname2)), "サンプル1 - [sm10]");
    // "sm10.flv";
    // "sm10.swf";
    // "サンプル1 - [sm10].mp4";
    // "サンプル1 - [sm10].flv";
    // "サンプル1 - [sm10].swf";
});

// test("file", t => {
//     const video_item = {
//         data_type:"",
//         dirpath:,
//         common_filename:,
//         video_type:,
//         thumbnail_size:,
//         is_deleted
//     };
//     const nd = new NicoVideoData();
// });