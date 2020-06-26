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
        return new Date().getTime();
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