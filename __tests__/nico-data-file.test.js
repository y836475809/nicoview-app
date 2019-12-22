const test = require("ava");
const path = require("path");
const { NicoXMLFile, NicoJsonFile } = require("../app/js/nico-data-file");

const setParams = (nico_file, params) => {
    nico_file.dirPath = params.dirpath;
    nico_file.commonFilename = params.common_filename;
    nico_file.videoType = params.video_type;
    nico_file.thumbnailSize = params.thumbnail_size;

    return nico_file;
};

const pn = (p) => {
    return path.normalize(p);
};

test.beforeEach(async t => {
    const params = {
        dirpath : "C:/data",
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

    const nico_file_S = setParams(new NicoXMLFile(), params_S);
    t.is(nico_file_S.videoPath, pn("C:/data/サンプル1.mp4"));
    t.is(nico_file_S.commentPath, pn("C:/data/サンプル1.xml"));
    t.is(nico_file_S.ownerCommentPath, pn("C:/data/サンプル1[Owner].xml"));
    t.is(nico_file_S.thumbInfoPath, pn("C:/data/サンプル1[ThumbInfo].xml"));
    t.is(nico_file_S.thumbImgPath, pn("C:/data/サンプル1[ThumbImg].jpeg"));
    t.is(nico_file_S.videoType, "mp4");

    const nico_file_L = setParams(new NicoXMLFile(), params_L);
    t.is(nico_file_L.videoPath, pn("C:/data/サンプル1.mp4"));
    t.is(nico_file_L.commentPath, pn("C:/data/サンプル1.xml"));
    t.is(nico_file_L.ownerCommentPath, pn("C:/data/サンプル1[Owner].xml"));
    t.is(nico_file_L.thumbInfoPath,pn( "C:/data/サンプル1[ThumbInfo].xml"));
    t.is(nico_file_L.thumbImgPath, pn("C:/data/サンプル1[ThumbImg].jpeg"));
    t.is(nico_file_L.videoType, "mp4");
});

test("nico data file json", async (t) => {
    const params_S = t.context.params_S;
    const params_L = t.context.params_L;

    const nico_file_S = setParams(new NicoJsonFile(), params_S);
    t.is(nico_file_S.videoPath, pn("C:/data/サンプル1.mp4"));
    t.is(nico_file_S.commentPath, pn("C:/data/サンプル1[Comment].json"));
    t.is(nico_file_S.thumbInfoPath, pn("C:/data/サンプル1[ThumbInfo].json"));
    t.is(nico_file_S.thumbImgPath, pn("C:/data/サンプル1[ThumbImg].jpeg"));
    t.is(nico_file_S.videoType, "mp4");

    const nico_file_L = setParams(new NicoJsonFile(), params_L);
    t.is(nico_file_L.videoPath, pn("C:/data/サンプル1.mp4"));
    t.is(nico_file_L.commentPath, pn("C:/data/サンプル1[Comment].json"));
    t.is(nico_file_L.thumbInfoPath, pn("C:/data/サンプル1[ThumbInfo].json"));
    t.is(nico_file_L.thumbImgPath, pn("C:/data/サンプル1[ThumbImg].L.jpeg"));
    t.is(nico_file_L.videoType, "mp4");
});