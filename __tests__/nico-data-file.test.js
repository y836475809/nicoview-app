const test = require("ava");
const path = require("path");
const { NicoXMLFile, NicoJsonFile, NicoDataFile,
    getIDFromFilename, getCommonNameFromFilename } = require("../app/js/nico-data-file");

const setParams = (nico_file, params) => {
    nico_file.dirPath = params.dirpath;
    nico_file.commonFilename = params.common_filename;
    nico_file.videoType = params.video_type;
    nico_file.thumbnailSize = params.thumbnail_size;

    return nico_file;
};

const pn = (p) => {
    return `${path.join(__dirname, "サンプル1 - [sm100]")}${p}`;
};

test.beforeEach(async t => {
    const params = {
        id : "sm100",
        dirpath : __dirname,
        common_filename : "サンプル1",
        video_type : "mp4"
    };

    t.context.params_S = Object.assign({}, params);
    t.context.params_S.thumbnail_size = "S";

    t.context.params_L = Object.assign({}, params);
    t.context.params_L.thumbnail_size = "L";
});

test("nico data file xml", async (t) => {
    const params_S = t.context.params_S;
    const params_L = t.context.params_L;

    const nico_file_S = setParams(new NicoXMLFile(params_S.id), params_S);
    t.is(nico_file_S.videoPath, pn(".mp4"));
    t.is(nico_file_S.commentPath, pn(".xml"));
    t.is(nico_file_S.ownerCommentPath, pn("[Owner].xml"));
    t.is(nico_file_S.thumbInfoPath, pn("[ThumbInfo].xml"));
    t.is(nico_file_S.thumbImgPath, pn("[ThumbImg].jpeg"));
    t.is(nico_file_S.videoType, "mp4");

    const nico_file_L = setParams(new NicoXMLFile(params_L.id), params_L);
    t.is(nico_file_L.videoPath, pn(".mp4"));
    t.is(nico_file_L.commentPath, pn(".xml"));
    t.is(nico_file_L.ownerCommentPath, pn("[Owner].xml"));
    t.is(nico_file_L.thumbInfoPath,pn( "[ThumbInfo].xml"));
    t.is(nico_file_L.thumbImgPath, pn("[ThumbImg].jpeg"));
    t.is(nico_file_L.videoType, "mp4");
});

test("nico data file json", async (t) => {
    const params_S = t.context.params_S;
    const params_L = t.context.params_L;

    const nico_file_S = setParams(new NicoJsonFile(params_S.id), params_S);
    t.is(nico_file_S.videoPath, pn(".mp4"));
    t.is(nico_file_S.commentPath, pn("[Comment].json"));
    t.is(nico_file_S.thumbInfoPath, pn("[ThumbInfo].json"));
    t.is(nico_file_S.thumbImgPath, pn("[ThumbImg].jpeg"));
    t.is(nico_file_S.videoType, "mp4");

    const nico_file_L = setParams(new NicoJsonFile(params_L.id), params_L);
    t.is(nico_file_L.videoPath, pn(".mp4"));
    t.is(nico_file_L.commentPath, pn("[Comment].json"));
    t.is(nico_file_L.thumbInfoPath, pn("[ThumbInfo].json"));
    t.is(nico_file_L.thumbImgPath, pn("[ThumbImg].L.jpeg"));
    t.is(nico_file_L.videoType, "mp4");
});

test("getIDFromFilename", (t) => {
    t.is(getIDFromFilename("test - [sm00].00 - [sm10].mp4"), "sm10");
    t.is(getIDFromFilename("test - [00].00 - [10].mp4"), "10");
});

test("getCommonNameFromFilename", (t) => {
    t.is(getCommonNameFromFilename("test - [sm00].00 - [sm10].mp4"), "test - [sm00].00");
    t.is(getCommonNameFromFilename("test - [00].00 - [10].mp4"), "test - [00].00");
});

test("cnvFilename", (t) => {
    const nd = new NicoDataFile();
    t.is("＼／：？”＊＜＞｜＃", nd._cnvFilename("\\/:?\"*<>|#"));
});