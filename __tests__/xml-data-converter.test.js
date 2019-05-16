const test = require("ava");
const Library = require("../app/js/library");
const { NicoXMLFile, NicoJsonFile } = require("../app/js/nico-data-file");
const { XMLDataConverter } = require("../app/js/xml-data-converter");

const data_path = `${__dirname}/data`;
let library = null;

class TestXMLDataConverter extends XMLDataConverter {
    async _read(file_path){ return ""; }
    async _write(file_path, data){}    
}

test.beforeEach(async t => {
    library = new Library();
    await library.init("test.db", true);
    const dirpath_list = [
        { _data_type:"dir", dirpath_id: 1, dirpath: data_path },
    ];
    const video_list = [
        {
            _data_type:"video", 
            _db_type:"xml", 
            video_id: "sm1",
            dirpath_id: 1,
            video_name: "サンプル1",
            common_filename: "サンプル1 - [sm1]",
            video_type: "mp4"
        },
        {
            _data_type:"video", 
            _db_type:"json", 
            video_id: "sm2",
            dirpath_id: 1,
            video_name: "サンプル2",
            common_filename: "サンプル2 - [sm2]",
            video_type: "mp4"
        },
        {
            _data_type:"video", 
            _db_type:"json", 
            video_id: "sm3",
            dirpath_id: 1,
            video_name: "サンプル3",
            common_filename: "sm3",
            video_type: "mp4"
        }
    ];

    await library.setData(dirpath_list, video_list);
});

//TODO
test("xml data converter need", async (t) => {
    const cnv_data = new TestXMLDataConverter();

    const nico_json = new NicoJsonFile();
    nico_json.dirPath = data_path;
    nico_json.commonFilename =  "サンプル1 - [sm1]";
    nico_json.videoType = "mp4";

    t.is(cnv_data._need("xml", nico_json), true);
});