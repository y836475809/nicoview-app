const test = require("ava");
const fs = require("fs");
const { NicoUpdate } = require("../app/js/nico-update");

const tmp_dir = `${__dirname}/tmp`;
const test_file_path = `${tmp_dir}/test.json`;
const tmp_file_path = `${tmp_dir}/_update.tmp`;

const old_data = {
    item: "old"
};
const new_data = {
    item: "new"
};

const cnvJson = (file_path) => { // eslint-disable-line no-unused-vars
    return JSON.parse(fs.readFileSync(test_file_path, "utf-8"));
};

test.beforeEach(t => {
    try {
        fs.statSync(tmp_dir);
    } catch (error) {
        fs.mkdirSync(tmp_dir);
    }
    fs.writeFileSync(test_file_path, JSON.stringify(old_data));

    try {
        fs.statSync(tmp_file_path);
        fs.unlinkSync(tmp_file_path);
    } catch (error) {
        // pass
    }

    t.context.video_item = {
        id : "sm10",
        data_type : "xml",
        common_filename: "test"
    };
});

test("writeFile sucess", t => {
    const video_item = t.context.video_item;
    const nico_update = new NicoUpdate(video_item);
    nico_update._writeFile(test_file_path, new_data, "json");

    t.notThrows(()=>{fs.statSync(test_file_path);});
    t.throws(()=>{fs.statSync(tmp_file_path);});
    t.deepEqual(cnvJson(test_file_path), new_data);
});

test("writeFile _write error", t => {
    class TestNicoUpdate extends NicoUpdate {
        _write(file_path, data){
            fs.writeFileSync(file_path, JSON.stringify(data));
            throw new Error();
        } 
    }
    const video_item = t.context.video_item;
    const nico_update = new TestNicoUpdate(video_item);
    t.throws(()=>{nico_update._writeFile(test_file_path, new_data, "json");});

    t.notThrows(()=>{fs.statSync(test_file_path);});
    t.throws(()=>{fs.statSync(tmp_file_path);});
    t.deepEqual(cnvJson(test_file_path), old_data);
});

test("writeFile _unlink error", t => {
    class TestNicoUpdate extends NicoUpdate {
        _write(file_path, data){
            fs.writeFileSync(file_path, JSON.stringify(data));
            throw new Error();
        } 
        _unlink(file_path){ // eslint-disable-line no-unused-vars
            throw new Error();
        } 
    }
    const video_item = t.context.video_item;
    const nico_update = new TestNicoUpdate(video_item);
    t.throws(()=>{nico_update._writeFile(test_file_path, new_data, "json");});

    t.notThrows(()=>{fs.statSync(test_file_path);});
    t.notThrows(()=>{fs.statSync(tmp_file_path);});
    t.deepEqual(cnvJson(test_file_path), old_data);
});


test("writeFile _rename error", t => {
    class TestNicoUpdate extends NicoUpdate {
        _rename(old_path, new_path){ // eslint-disable-line no-unused-vars
            throw new Error();
        } 
    }
    const video_item = t.context.video_item;
    const nico_update = new TestNicoUpdate(video_item);
    t.throws(()=>{nico_update._writeFile(test_file_path, new_data, "json");});

    t.notThrows(()=>{fs.statSync(test_file_path);});
    t.notThrows(()=>{fs.statSync(tmp_file_path);});
    t.deepEqual(cnvJson(test_file_path), old_data);
});
