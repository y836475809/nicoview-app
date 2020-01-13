const test = require("ava");
const { ConfigMain } = require("../app/js/config");

class TestConfigMain extends ConfigMain {
    setup(){}
}

test("getObj dot notation", t => {
    const cfg_main = new TestConfigMain();
    const json_data = {};
    t.is(cfg_main.getObj("test", json_data), undefined);
    t.deepEqual(json_data, {});
});

test("getObj dot notation2", t => {
    const cfg_main = new TestConfigMain();
    const json_data = {};
    json_data["test"] = {value1:10, value2:"val2"};

    t.deepEqual(cfg_main.getObj("test", json_data), {value1:10, value2:"val2"});
    t.is(cfg_main.getObj("test.value1", json_data), 10);
    t.is(cfg_main.getObj("test.value2", json_data), "val2");
    t.is(cfg_main.getObj("test.value3", json_data), undefined);
    t.is(cfg_main.getObj("test.value1.value1", json_data), undefined);

    t.deepEqual(json_data, {test:{value1:10, value2:"val2"}});
});

test("setObj dot notation1", t => {
    const cfg_main = new TestConfigMain();
    const json_data = {};

    cfg_main.setObj("test", 1, json_data);
    t.deepEqual(json_data, {test:1});

    cfg_main.setObj("test", 2, json_data);
    t.deepEqual(json_data, {test:2});

    cfg_main.setObj("test.value1", 3, json_data);
    t.deepEqual(json_data, {test:{value1:3}});

    cfg_main.setObj("test.value1", 4, json_data);
    t.deepEqual(json_data, {test:{value1:4}});

    cfg_main.setObj("test.value2", 5, json_data);
    t.deepEqual(json_data, {test:{value1:4, value2:5}});

    cfg_main.setObj("test.value2", 6, json_data);
    t.deepEqual(json_data, {test:{value1:4, value2:6}});
});