const test = require("ava");
const fs = require("fs");
const { MylistReader } = require("../app/js/mylist-reader");

let mylist_xml = null;
test.before(t => {
    mylist_xml = fs.readFileSync(`${__dirname}/data/mylist00000000.xml`, "utf-8");
});

test("nico mylist parse xml", t => {
    const mrd = new MylistReader();
    const mylist = mrd.parse(mylist_xml);

    t.deepEqual(mylist, {
        title: "マイリスト1",
        link: "http://www.nicovideo.jp/mylist/00000000",
        description: "説明\r\n動画マイリスト",
        creator: "user1",
        items: [
            {
                title: "動画3",
                link: "http://www.nicovideo.jp/watch/sm12345678",
                memo: "動画3メモ",
                thumbnail_src: "http://tn.smilevideo.jp/smile?i=12345678.63399.M",
                length: "100:10",
                date: "2000年1月3日 03：03：03",
                num_view: "10,000",
                num_comment: "100"
            },
            {
                title: "動画2",
                link: "http://www.nicovideo.jp/watch/sm20",
                memo: "動画2メモ1\r\n動画2メモ2\r\n動画2メモ3",
                thumbnail_src: "http://tn.smilevideo.jp/smile?i=20.M",
                length: "50:50",
                date: "2000年1月2日 02：02：02",
                num_view: "200,000",
                num_comment: "1,000"
            },
            {
                title: "動画1",
                link: "http://www.nicovideo.jp/watch/sm10",
                memo: "動画1メモ1\r\n動画1メモ2\r\n動画1メモ3\r\n動画1メモ4",
                thumbnail_src: "http://tn.smilevideo.jp/smile?i=10",
                length: "0:10",
                date: "2000年1月1日 01：01：01",
                num_view: "20",
                num_comment: "30"
            }
        ]
    });
});

test("nico mylist error xml empty", t => {
    const mrd = new MylistReader();
    t.throws(() => { mrd.parse(""); });
});

test("nico mylist error parse xml", t => {
    const mrd = new MylistReader();
    t.throws(() => { mrd.parse(null); });
});

test("nico mylist result is correct", t => {
    const mrd = new MylistReader();

    t.truthy(mrd._isCorrect({
        title: "--",
        link: "--",
        description: "--",
        creator: "--",
        items: [{
            title : "--",
            link : "--",
            thumbnail_src: "--",
            length: "--",
            date: "--"
        }]
    }));

    t.truthy(mrd._isCorrect({
        title: "--",
        link: "--",
        description: "--",
        creator: "--",
        items: []
    }));

    t.truthy(mrd._isCorrect({
        title: "--",
        link: "--",
        description: "",
        creator: "--",
        items: []
    }));
});

test("nico mylist result is incorrect", t => {
    const mrd = new MylistReader();

    t.falsy(mrd._isCorrect({
        title: "",
        link: "--",
        description: "--",
        creator: "--",
        items: []
    }));

    t.falsy(mrd._isCorrect({
        title: "--",
        link: "",
        description: "--",
        creator: "--",
        items: []
    }));

    t.falsy(mrd._isCorrect({
        title: "--",
        link: "",
        description: "--",
        creator: "",
        items: []
    }));

    t.falsy(mrd._isCorrect({
        title: "--",
        link: "--",
        description: "--",
        creator: "--",
        items: [{
            title : "",
            link : "--",
            thumbnail_src: "--",
            length: "--",
            date: "--"
        }]
    }));

    t.falsy(mrd._isCorrect({
        title: "--",
        link: "--",
        description: "--",
        creator: "--",
        items: [{
            title : "--",
            link : "",
            thumbnail_src: "--",
            length: "--",
            date: "--"
        }]
    }));

    
    t.falsy(mrd._isCorrect({
        title: "--",
        link: "--",
        description: "--",
        creator: "--",
        items: [{
            title : "--",
            link : "--",
            thumbnail_src: "",
            length: "--",
            date: "--"
        }]
    }));
        
    t.falsy(mrd._isCorrect({
        title: "--",
        link: "--",
        description: "--",
        creator: "--",
        items: [{
            title : "--",
            link : "--",
            thumbnail_src: "--",
            length: "",
            date: "--"
        }]
    }));
   
    t.falsy(mrd._isCorrect({
        title: "--",
        link: "--",
        description: "--",
        creator: "--",
        items: [{
            title : "--",
            link : "--",
            thumbnail_src: "--",
            length: "--",
            date: ""
        }]
    }));

    t.falsy(mrd._isCorrect({
        title: "--",
        link: "--",
        description: "--",
        creator: "--",
        items: [{
            title : "--",
            link : "--",
            thumbnail_src: "--",
            length: "--",
            date: "--"
        },
        {
            title : "",
            link : "--",
            thumbnail_src: "--",
            length: "--",
            date: "--"
        }]
    }));
});