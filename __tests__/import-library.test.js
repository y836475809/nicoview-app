const test = require("ava");
const path = require("path");
const { ImportLibrary } = require("../app/js/import-library");

const dir = path.join(__dirname, "data", "import");
const video_filepath = path.join(dir, "import - [sm100].mp4");
const dummy_video_filepath = path.join(dir, "import - [sm1000].mp4");

class TestImportLibrary extends ImportLibrary {
    constructor(video_filepath){
        super(video_filepath);
        this.paths = [];
    }
    async _existFile(file_path){
        this.paths.push(file_path);
        return true;
    }
    async _getCreationTime(file_path){
        return new Date();
    }
}

class TestXMLImportLibrary extends ImportLibrary {
    constructor(video_filepath, data_type){
        super(video_filepath);
        this._data_type = data_type;
    }
    async _existFile(file_path){
        return true;
    }
    async _getCreationTime(file_path){
        return new Date();
    }
    async _getThumbnailSize(){
        return "S";
    }
    async _getDataType(){
        return this._data_type;
    }
}

test("_getThumbInfo ", t => {
    {
        const im_lib = new ImportLibrary(video_filepath);
        const thumb_info = im_lib._getThumbInfo("json");
        t.is(thumb_info.video.video_id, "sm100");
    }
    {
        const im_lib = new ImportLibrary(video_filepath);
        const thumb_info = im_lib._getThumbInfo("xml");
        t.is(thumb_info.video.video_id, "sm100");
    }
    {
        const im_lib = new ImportLibrary(video_filepath);
        const thumb_info = im_lib._getThumbInfo("json");
        t.is(thumb_info.video.video_id, "sm100");
    }

    {
        const im_lib = new ImportLibrary(dummy_video_filepath);
        t.throws(() => { im_lib._getThumbInfo("json"); });
    }

    {
        const im_lib = new ImportLibrary(dummy_video_filepath);
        t.throws(() => { im_lib._getThumbInfo("xml"); });
    }
});

test("createLibraryItem xml", async t => {
    const im_lib = new TestXMLImportLibrary(video_filepath, "xml");
    const lib_item = await im_lib.createLibraryItem();
    t.is(lib_item.data_type, "xml");
    t.is(lib_item.thumbnail_size, "S");
    t.is(lib_item.id, "sm100");
    t.is(lib_item.dirpath, dir);
    t.is(lib_item.title, "import test xml");
    t.is(lib_item.video_type, "mp4");
    t.is(lib_item.common_filename, "import");
    t.is(lib_item.last_play_date, -1);
    t.is(lib_item.modification_date, -1);
    t.is(lib_item.play_count, 0);
    t.is(lib_item.is_economy, false);
    t.is(lib_item.play_time, 70);
    t.deepEqual(lib_item.tags, ["xml_tag1","xml_tag2"]);
    t.is(lib_item.is_deleted, false);
});

test("createLibraryItem json", async t => {
    const im_lib = new TestXMLImportLibrary(video_filepath, "json");
    const lib_item = await im_lib.createLibraryItem();
    t.is(lib_item.data_type, "json");
    t.is(lib_item.thumbnail_size, "S");
    t.is(lib_item.id, "sm100");
    t.is(lib_item.dirpath, dir);
    t.is(lib_item.title, "import test json");
    t.is(lib_item.video_type, "mp4");
    t.is(lib_item.common_filename, "import");
    t.is(lib_item.last_play_date, -1);
    t.is(lib_item.modification_date, -1);
    t.is(lib_item.play_count, 0);
    t.is(lib_item.is_economy, false);
    t.is(lib_item.play_time, 70);
    t.deepEqual(lib_item.tags, ["json_tag1","json_tag2"]);
    t.is(lib_item.is_deleted, false);
});

test("file path ", async t => {
    const im_lib = new TestImportLibrary(video_filepath);
    await im_lib._getThumbnailSize();
    await im_lib._existThumbInfo("xml");
    await im_lib._existThumbInfo("json");

    const paths = im_lib.paths;
    t.deepEqual(paths, [
        path.join(dir, "import - [sm100][ThumbImg].L.jpeg"),
        path.join(dir, "import - [sm100][ThumbInfo].xml"),
        path.join(dir, "import - [sm100][ThumbInfo].json")
    ]);
});