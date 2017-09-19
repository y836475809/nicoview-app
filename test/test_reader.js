
const assert = require("power-assert");
const fs = require('fs');
const reader = require("../app/js/reader")


it("read comment", function () {
    const xml = fs.readFileSync("./sample/sample.xml", "utf-8");
    const obj = reader.comment(xml)
    assert.deepStrictEqual(obj[0], {no:1, vpos:400, date:1505310000, user_id:"AAA", mail:"naka medium 184", text:"AAAテスト"})

})

it("read thumb info", function () {
    const xml = fs.readFileSync("./sample/sample[ThumbInfo].xml", "utf-8");
    const obj = reader.thumb_info(xml)

    assert.equal(obj.video_id, "sm1000")

    assert.deepStrictEqual(obj.tags[0], {tag:"タグ1", lock:"1"})
    assert.deepStrictEqual(obj.tags[1], {tag:"タグ2", lock:""})
    assert.deepStrictEqual(obj.tags[2], {tag:"タグ3", lock:""})

})