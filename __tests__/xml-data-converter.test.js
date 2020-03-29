const test = require("ava");
const fsPromises = require("fs").promises;
const { XMLDataConverter } = require("../app/js/xml-data-converter");

test.beforeEach(async t => {
    t.context.xml ={
        thumbinfo:await fsPromises.readFile(`${__dirname}/data/convert_sample[ThumbInfo].xml`),
        user_comment_xml:await fsPromises.readFile(`${__dirname}/data/convert_sample.xml`),
        owner_comment_xml:await fsPromises.readFile(`${__dirname}/data/convert_sample[Owner].xml`)
    };
});

class TestXMLDataConverter extends XMLDataConverter {
    async _read(file_path){ return ""; }
    async _write(file_path, data){} 
}

test("_convertThumbinfo", async (t) => {
    const cnv_data = new TestXMLDataConverter();
    const { thumbinfo } = t.context.xml;

    const data = cnv_data._convertThumbinfo(thumbinfo);
    t.deepEqual(data, {
        video: {
            video_id: "sm1000",
            title: "sample.mp4",
            description: "投稿コメントサンプル",
            thumbnailURL: "http://smile?i=1000",
            largeThumbnailURL: "http://smile?i=1000",
            postedDateTime: "2000-01-01T01:02:03+09:00",
            duration: "00:10",
            viewCount: 100,
            mylistCount: 5,
            video_type: "mp4"
        },
        thread: {
            commentCount: 10
        },
        tags: [
            { id: "0", name: "タグ1", isLocked: true},
            { id: "1", name: "タグ2", isLocked: false},
        ],
        owner: {
            id: "00000",
            nickname: "ニックネーム",
            iconURL: "https://blank_s.jpg"
        }
    });
});

test("_convertComment", async (t) => {
    const cnv_data = new TestXMLDataConverter();
    const { user_comment_xml, owner_comment_xml } = t.context.xml;

    const comment_data = cnv_data._convertComment(user_comment_xml, owner_comment_xml);
    const threads = comment_data.filter(value => {
        return value.hasOwnProperty("thread");
    });
    const comments = comment_data.filter(value => {
        return value.hasOwnProperty("chat");
    });

    t.deepEqual(threads,[ 
        {
            thread:{
                resultcode:0,
                thread:"1505300000",
                fork: 1,
                server_time:1505310000,
                last_res:1,
                ticket:"0x00000000",
                revision:1,
            }
        },{
            thread:{
                resultcode:0,
                thread:"1505300000",
                server_time:1505310000,
                last_res:10,
                ticket:"0x00000000",
                revision:1,
            }
        },{
            thread:{
                resultcode:0,
                thread:"1505300000",
                server_time:1505310000,
                last_res:10,
                ticket:"0x00000000",
                revision:1,
            }
        }
    ]);
    t.deepEqual(comments,[ 
        {chat:{no:1, vpos:100, date:1000, fork:1, content:"owner1"}},
        {chat:{no:1, vpos:400, date:0, user_id:"AAA", mail:"naka medium 184", content:"AAAテスト"}},
        {chat:{no:2, vpos:300, date:1, user_id:"BBB", mail:"184", content:"BBBあ"}},
    ]);  
});
