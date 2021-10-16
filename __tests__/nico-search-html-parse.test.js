const test = require("ava");
const fs = require("fs");
const path = require("path");
const { nicoSearchHtmlParse } = require("../app/js/nico-search-html-parse");

test.before(t => {
    ["search", "tag"].forEach(name=>{
        const f_pth = path.join(__dirname, "..", "test", "mock_server", "data", "html", `${name}.html`);
        t.context[name] = fs.readFileSync(f_pth, "utf-8");
    });
});

function parseHtml(t, target) {
    const result = nicoSearchHtmlParse(t.context[target], target);
    t.true(result.total_num > 0);
    t.is(32, result.list.length);
    result.list.forEach(items => {
        t.is(8, Object.keys(items).length);
        Object.keys(items).forEach(key => {
            t.not(items[key], undefined);
        });
    });
}

test("parse search html", parseHtml, "search");
test("parse tag html", parseHtml, "tag");