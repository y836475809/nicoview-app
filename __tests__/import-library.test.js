const test = require("ava");
const path = require("path");
const { ImportLibrary } = require("../app/js/import-library");

test("match", t => {
    {
        const im_lib = new ImportLibrary(path.join(__dirname, "sm100.mp4"));
        t.truthy(im_lib._matchJoin());
        t.falsy(im_lib._matchNNDD());
    }
    {
        const im_lib = new ImportLibrary(path.join(__dirname, "sm100.flv"));
        t.truthy(im_lib._matchJoin());
        t.falsy(im_lib._matchNNDD());
    }
    {
        const im_lib = new ImportLibrary(path.join(__dirname, "sm100.swf"));
        t.truthy(im_lib._matchJoin());
        t.falsy(im_lib._matchNNDD());
    }
    {
        const im_lib = new ImportLibrary(path.join(__dirname, "sm100.jpeg"));
        t.falsy(im_lib._matchJoin());
        t.falsy(im_lib._matchNNDD());
    }

    {
        const im_lib = new ImportLibrary(path.join(__dirname, "サンプル1 - [sm100].mp4"));
        t.falsy(im_lib._matchJoin());
        t.truthy(im_lib._matchNNDD());
    }
    {
        const im_lib = new ImportLibrary(path.join(__dirname, "サンプル1 - [sm100].flv"));
        t.falsy(im_lib._matchJoin());
        t.truthy(im_lib._matchNNDD());
    }
    {
        const im_lib = new ImportLibrary(path.join(__dirname, "サンプル1 - [sm100].swf"));
        t.falsy(im_lib._matchJoin());
        t.truthy(im_lib._matchNNDD());
    }
    {
        const im_lib = new ImportLibrary(path.join(__dirname, "サンプル1 - [sm100].jpeg"));
        t.falsy(im_lib._matchJoin());
        t.falsy(im_lib._matchNNDD());
    }

    {
        const im_lib = new ImportLibrary(path.join(__dirname, "サンプル1.mp4"));
        t.falsy(im_lib._matchJoin());
        t.falsy(im_lib._matchNNDD());
    }
});

test("_getThumbInfo ", t => {

    const dir = path.join(__dirname, "data", "import");
    {
        const im_lib = new ImportLibrary(path.join(dir, "sm100.mp4"));
        const thumb_info = im_lib._getThumbInfo("json");
        t.is(thumb_info.video.video_id, "sm100");
    }
    {
        const im_lib = new ImportLibrary(path.join(dir, "import - [sm100].mp4"));
        const thumb_info = im_lib._getThumbInfo("xml");
        t.is(thumb_info.video.video_id, "sm100");
    }
    {
        const im_lib = new ImportLibrary(path.join(dir, "import - [sm100].mp4"));
        const thumb_info = im_lib._getThumbInfo("json");
        t.is(thumb_info.video.video_id, "sm100");
    }

    {
        const im_lib = new ImportLibrary(path.join(dir, "sm1000.mp4"));
        t.throws(() => { im_lib._getThumbInfo("json"); });
    }

    {
        const im_lib = new ImportLibrary(path.join(dir, "sm1000.mp4"));
        t.throws(() => { im_lib._getThumbInfo("xml"); });
    }
});
