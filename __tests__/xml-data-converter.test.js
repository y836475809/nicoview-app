const test = require("ava");
const { NicoXMLFile, NicoJsonFile } = require("../app/js/nico-data-file");
const { XMLDataConverter } = require("../app/js/xml-data-converter");

//TODO

let nico_json = null;

test.beforeEach(async t => {
    nico_json = new NicoJsonFile();
    nico_json.dirPath = "./data";
    nico_json.commonFilename =  "サンプル1 - [sm1]";
    nico_json.videoType = "mp4";
});

class TestXMLDataConverter extends XMLDataConverter {
    async _read(file_path){ return ""; }
    async _write(file_path, data){} 
}

test("_convertThumbinfo", async (t) => {
    const cnv_data = new TestXMLDataConverter();

});

test("convertComment", async (t) => {
    const cnv_data = new TestXMLDataConverter();

});
