const test = require("ava");
const fsPromises = require("fs").promises;
const { XMLDataConverter } = require("../app/js/xml-data-converter");

test.beforeEach(async t => {
    t.context.xml ={
        thumbinfo:await fsPromises.readFile(`${__dirname}/data/convert_sample[ThumbInfo].xml`),
        comments:await fsPromises.readFile(`${__dirname}/data/convert_sample.xml`),
        owner_comments:await fsPromises.readFile(`${__dirname}/data/convert_sample[Owner].xml`)
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
    const { comments, owner_comments } = t.context.xml;

    const data = cnv_data._convertComment(comments, owner_comments);
    t.deepEqual(data, [
        {
            no: 1,
            vpos: 400,
            date: 0,
            user_id: "AAA",
            mail: "naka medium 184",
            content: "AAAテスト"
        },
        {
            no: 2,
            vpos: 300,
            date: 1,
            user_id: "BBB",
            mail: "184",
            content: "BBBあ"
        }]);  
});
