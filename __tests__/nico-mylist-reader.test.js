const test = require("ava");
const fs = require("fs");
const { NicoMylistReader } = require("../src/lib/nico-mylist");

let mylist_xml = null;
test.before(t => { // eslint-disable-line no-unused-vars
    mylist_xml = fs.readFileSync(`${__dirname}/data/mylist00000000.xml`, "utf-8");
});

test("nico mylist get video id from link", t => {
    const mrd = new NicoMylistReader();
    t.is("sm12345",
        mrd._getVideoIDFromLink("http://www.nicovideo.jp/mylist/sm12345"));

    t.is("sm12345",
        mrd._getVideoIDFromLink("http://www.nicovideo.jp/mylist/sm12345?ref=rss_mylist_rss2"));        
});

test("nico mylist parse xml", t => {
    const mrd = new NicoMylistReader();
    const mylist = mrd.parse("mylist/00000000", mylist_xml);

    t.deepEqual(mylist, {
        title: "マイリスト1",
        mylist_id:"mylist/00000000",
        link: "http://www.nicovideo.jp/mylist/00000000",
        description: "説明\n動画マイリスト",
        creator: "user1",
        items: [
            {
                no: 1,
                title: "動画3",
                video_id: "sm12345678",
                link: "http://www.nicovideo.jp/watch/sm12345678",
                description: "動画3メモ",
                thumb_img: "http://tn.smilevideo.jp/smile?i=12345678.63399.M",
                length: "100:10",
                date: "2000年1月3日 03：03：03",
            },
            {
                no: 2,
                title: "動画2",
                video_id: "sm20",
                link: "http://www.nicovideo.jp/watch/sm20",
                description: "動画2メモ1\n動画2メモ2\n動画2メモ3",
                thumb_img: "http://tn.smilevideo.jp/smile?i=20.M",
                length: "50:50",
                date: "2000年1月2日 02：02：02",
            },
            {
                no: 3,
                title: "動画1",
                video_id: "sm10",
                link: "http://www.nicovideo.jp/watch/sm10",
                description: "動画1メモ1\n動画1メモ2\n動画1メモ3\n動画1メモ4",
                thumb_img: "http://tn.smilevideo.jp/smile?i=10",
                length: "0:10",
                date: "2000年1月1日 01：01：01",
            }
        ]
    });
});

test("nico mylist error xml empty", t => {
    const mrd = new NicoMylistReader();
    t.throws(() => { mrd.parse("mylist/00000000", ""); });
});

test("nico mylist error parse xml", t => {
    const mrd = new NicoMylistReader();
    t.throws(() => { mrd.parse("mylist/00000000", null); });
});

test("nico mylist result is correct", t => {
    const mrd = new NicoMylistReader();

    t.truthy(mrd._isCorrect({
        title: "--",
        mylist_id:"--",
        link: "--",
        description: "--",
        creator: "--",
        items: [{
            title : "--",
            video_id: "--",
            link : "--",
            thumb_img: "--",
            length: "--",
            date: "--"
        }]
    }));

    t.truthy(mrd._isCorrect({
        title: "--",
        mylist_id:"--",
        link: "--",
        description: "--",
        creator: "--",
        items: []
    }));

    t.truthy(mrd._isCorrect({
        title: "--",
        mylist_id:"--",
        link: "--",
        description: "",
        creator: "--",
        items: []
    }));
});

test("nico mylist result is incorrect", t => {
    const mrd = new NicoMylistReader();

    t.falsy(mrd._isCorrect({
        title: "",
        mylist_id:"--",
        link: "--",
        description: "--",
        creator: "--",
        items: []
    }));

    t.falsy(mrd._isCorrect({
        title: "--",
        mylist_id:"",
        link: "--",
        description: "--",
        creator: "--",
        items: []
    }));

    t.falsy(mrd._isCorrect({
        title: "--",
        mylist_id:"--",
        link: "",
        description: "--",
        creator: "--",
        items: []
    }));

    t.falsy(mrd._isCorrect({
        title: "--",
        mylist_id:"--",
        link: "",
        description: "--",
        creator: "",
        items: []
    }));

    t.falsy(mrd._isCorrect({
        title: "--",
        mylist_id:"--",
        link: "--",
        description: "--",
        creator: "--",
        items: [{
            title : "",
            video_id: "--",
            link : "--",
            thumb_img: "--",
            length: "--",
            date: "--"
        }]
    }));

    t.falsy(mrd._isCorrect({
        title: "--",
        mylist_id:"--",
        link: "--",
        description: "--",
        creator: "--",
        items: [{
            title : "--",
            video_id: "",
            link : "--",
            thumb_img: "--",
            length: "--",
            date: "--"
        }]
    }));

    t.falsy(mrd._isCorrect({
        title: "--",
        mylist_id:"--",
        link: "--",
        description: "--",
        creator: "--",
        items: [{
            title : "--",
            video_id: "--",
            link : "",
            thumb_img: "--",
            length: "--",
            date: "--"
        }]
    }));

    
    t.falsy(mrd._isCorrect({
        title: "--",
        mylist_id:"--",
        link: "--",
        description: "--",
        creator: "--",
        items: [{
            title : "--",
            link : "--",
            thumb_img: "",
            length: "--",
            date: "--"
        }]
    }));
        
    t.falsy(mrd._isCorrect({
        title: "--",
        mylist_id:"--",
        link: "--",
        description: "--",
        creator: "--",
        items: [{
            title : "--",
            link : "--",
            thumb_img: "--",
            length: "",
            date: "--"
        }]
    }));
   
    t.falsy(mrd._isCorrect({
        title: "--",
        mylist_id:"--",
        link: "--",
        description: "--",
        creator: "--",
        items: [{
            title : "--",
            link : "--",
            thumb_img: "--",
            length: "--",
            date: ""
        }]
    }));

    t.falsy(mrd._isCorrect({
        title: "--",
        mylist_id:"--",
        link: "--",
        description: "--",
        creator: "--",
        items: [{
            title : "--",
            link : "--",
            thumb_img: "--",
            length: "--",
            date: "--"
        },
        {
            title : "",
            link : "--",
            thumb_img: "--",
            length: "--",
            date: "--"
        }]
    }));
});