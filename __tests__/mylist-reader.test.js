const test = require("ava");
const fs = require("fs");
const { MylistReader } = require("../app/js/mylist-reader");

let mylist_xml = null;

test.before(t => {
    mylist_xml = fs.readFileSync(`${__dirname}/data/mylist00000000.xml`, "utf-8");
});

test("nico search params", t => {
    const mr = new MylistReader();
    const mylist = mr.parse(mylist_xml);
    console.log(mylist.items[0]);

    t.is(mylist.items.length, 3);
});