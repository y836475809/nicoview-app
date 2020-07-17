const test = require("ava");
const path = require("path");
const { JsonDataConverter } = require("../app/js/nico-data-converter");
const owner_comment_json = require("./data/owner-comment.json");
const no_owner_comment_json = require("./data/no-owner-comment.json");

class TestPathJsonDataConverter extends JsonDataConverter{
    constructor(video_item){
        super(video_item);
        this.paths = [];
    }

    _convertThumbinfo(json){
        return "";
    }

    _convertComment(comment_json){
        return "";
    }

    async _read(file_path){
        this.paths.push(file_path);
        return "[]";
    }

    async _write(file_path, data){
        this.paths.push(file_path);
    }

    async _copyFile(src_file_path, dist_file_path){
        this.paths.push(src_file_path);
        this.paths.push(dist_file_path);
    }   
}

test.beforeEach(t => {
    const video_item = {
        data_type: "json", 
        id: "sm10",
        dirpath_id: 1,
        dirpath: __dirname,
        title: "test title",
        common_filename: "test",
        video_type: "mp4",
        is_deleted: false,
        tags: [],
        thumbnail_size: "L"
    };

    const video_item_s = Object.assign({}, video_item);
    video_item_s.thumbnail_size = "S";

    t.context.cnv_data = new JsonDataConverter(video_item);
    t.context.path_cnv_data = new TestPathJsonDataConverter(video_item);
    t.context.path_cnv_data_S = new TestPathJsonDataConverter(video_item_s);
});

test("_convertDate", t => {
    const cnv_data = t.context.cnv_data;
    t.is(
        cnv_data._convertDate("2000/10/02 03:40:50"),
        "2000-10-02T03:40:50+09:00");
});

test("_convertDescription", t => {
    const cnv_data = t.context.cnv_data;
    const json_desc = 
        'test<a href="https://www.nicovideo.jp/watch/sm10" class="watch">sm10</a>'
        +"& &lt;　&gt;<br>"
        +'<a href="https://www.nicovideo.jp/mylist/10" target="_blank" rel="noopener">mylist/10</a>'; 
    t.is(
        cnv_data._convertDescription(json_desc),
        "test&lt;a href=&quot;https://www.nicovideo.jp/watch/sm10&quot; class=&quot;watch&quot;&gt;sm10&lt;/a&gt;"
        +"&amp; &amp;lt;　&amp;gt;&lt;br&gt;"
        +"&lt;a href=&quot;https://www.nicovideo.jp/mylist/10&quot; target=&quot;_blank&quot; rel=&quot;noopener&quot;&gt;mylist/10&lt;/a&gt;");
});


test("_convertTags", t => {
    const cnv_data = t.context.cnv_data;
    const tags = cnv_data._convertTags([
        { name: "タグ1", isLocked: true, category: true},
        { name: "タグ2", isLocked: true},
        { name: "タグ3", isLocked: false},
    ]);
    t.is(tags, 
        [
            '<tag category="1" lock="1">タグ1</tag>',
            '<tag lock="1">タグ2</tag>',
            "<tag>タグ3</tag>",
        ].join("\r\n")
    );
});

test("_convertComment owner_comment", t => {
    const cnv_data = t.context.cnv_data;
    const { owner_comment_xml, user_comment_xml } = 
        cnv_data._convertComment(owner_comment_json);
    
    t.is(owner_comment_xml, 
        [
            "<packet>",
            '<thread resultcode="0" thread="01234567890" last_res="2" ticket="0x1234567890" revision="1" fork="1" server_time="1546694359"/>',
            '<chat thread="01234567890" no="1" vpos="100" date="1360996778" mail="shita green small" fork="1">owner comment1\ncomment1</chat>',
            '<chat thread="01234567890" no="2" vpos="200" date="1360996778" mail="shita green small" fork="1">owner comment2</chat>',
            "</packet>",
        ].join("\r\n")
    );
    t.is(user_comment_xml, 
        [
            "<packet>",
            '<thread resultcode="0" thread="1234567890" last_res="2" ticket="0x83d23581" revision="2" server_time="1546694359"/>',
            '<chat thread="1234567890" no="16" vpos="300" date="1359607148" mail="184" user_id="abcdefg">comment3</chat>',
            '<chat thread="1234567890" no="17" vpos="400" date="1359607224" mail="184" user_id="hijklnm">comment4</chat>',
            "</packet>",
        ].join("\r\n")
    );
});

test("_convertComment no_owner_comment", t => {
    const cnv_data = t.context.cnv_data;
    const { owner_comment_xml, user_comment_xml } = 
        cnv_data._convertComment(no_owner_comment_json);
    
    t.is(owner_comment_xml, 
        [
            "<packet>",
            '<thread resultcode="0" thread="1234567890" last_res="0" ticket="0" revision="1" fork="1" server_time="1546694145"/>',
            "",
            "</packet>",
        ].join("\r\n")
    );
    t.is(user_comment_xml, 
        [
            "<packet>",
            '<thread resultcode="0" thread="1234567890" last_res="2" ticket="0xb18d801d" revision="1" server_time="1546694145"/>',
            '<chat thread="1234567890" no="1" vpos="100" date="1522161709" mail="184" user_id="abcdefg">comment1</chat>',
            '<chat thread="1234567890" no="2" vpos="200" date="1522161986" mail="184" user_id="hijklmn">comment2</chat>',
            "</packet>",
        ].join("\r\n")
    );
});

test("paths thumbnail L", async t => {
    const cnv_data = t.context.path_cnv_data;
   
    await cnv_data.convertThumbInfo();
    t.deepEqual(cnv_data.paths, [
        path.join(__dirname, "test - [sm10][ThumbInfo].json"),
        path.join(__dirname, "test - [sm10][ThumbInfo].xml")
    ]);
    cnv_data.paths = [];

    await cnv_data.convertComment();
    t.deepEqual(cnv_data.paths, [
        path.join(__dirname, "test - [sm10][Comment].json"),
        path.join(__dirname, "test - [sm10][Owner].xml"),
        path.join(__dirname, "test - [sm10].xml")
    ]);
    cnv_data.paths = [];
    
    await cnv_data.convertThumbnai();
    t.deepEqual(cnv_data.paths, [
        path.join(__dirname, "test - [sm10][ThumbImg].L.jpeg"),
        path.join(__dirname, "test - [sm10][ThumbImg].jpeg")
    ]);
});

test("paths thumbnail S", async t => {
    const cnv_data = t.context.path_cnv_data_S;
   
    await cnv_data.convertThumbInfo();
    t.deepEqual(cnv_data.paths, [
        path.join(__dirname, "test - [sm10][ThumbInfo].json"),
        path.join(__dirname, "test - [sm10][ThumbInfo].xml")
    ]);
    cnv_data.paths = [];

    await cnv_data.convertComment();
    t.deepEqual(cnv_data.paths, [
        path.join(__dirname, "test - [sm10][Comment].json"),
        path.join(__dirname, "test - [sm10][Owner].xml"),
        path.join(__dirname, "test - [sm10].xml")
    ]);
    cnv_data.paths = [];
    
    await cnv_data.convertThumbnai();
    t.deepEqual(cnv_data.paths, []);
});