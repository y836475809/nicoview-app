const test = require("ava");
const { ConfigMain } = require("../app/js/config");

class TestConfigMain extends ConfigMain {
    setup(){}
}

test("getObj json_data empty", t => {
    const cfg_main = new TestConfigMain();
    const json_data = {};
    t.is(cfg_main.getObj("test", json_data), undefined);
    t.deepEqual(json_data, {});
});

test("getObj json_data has obj", t => {
    const cfg_main = new TestConfigMain();
    const json_data = {test: {value1:10, value2:"val2", value3:{}}};

    t.deepEqual(cfg_main.getObj("test", json_data), {value1:10, value2:"val2", value3:{}});
    t.is(cfg_main.getObj("test.value1", json_data), 10);
    t.is(cfg_main.getObj("test.value2", json_data), "val2");
    t.deepEqual(cfg_main.getObj("test.value3", json_data), {});
    t.is(cfg_main.getObj("test.value4", json_data), undefined);
    t.is(cfg_main.getObj("test.value1.value1", json_data), undefined);

    t.deepEqual(json_data, {test:{value1:10, value2:"val2", value3:{}}});
});

test("setObj add", t => {
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
    
    cfg_main.setObj("test", {value3:7}, json_data);
    t.deepEqual(json_data, {test:{value1:4, value2:6, value3:7}});
});

test("setObj replace obj", t => {
    const cfg_main = new TestConfigMain();
    const json_data = {};

    cfg_main.setObj("test", {value:1}, json_data);
    t.deepEqual(json_data, {test:{value:1}});

    cfg_main.setObj("test", {value:2}, json_data);
    t.deepEqual(json_data, {test:{value:2}});

    cfg_main.setObj("test.value1", {value:3}, json_data);
    t.deepEqual(json_data, {test:{value:2, value1:{value:3}}});

    cfg_main.setObj("test.value1", {value:4}, json_data);
    t.deepEqual(json_data, {test:{value:2, value1:{value:4}}});

    cfg_main.setObj("test.value2", {value:5}, json_data);
    t.deepEqual(json_data, {test:{value:2, value1:{value:4}, value2:{value:5}}});

    cfg_main.setObj("test.value2", {value:6}, json_data);
    t.deepEqual(json_data, {test:{value:2, value1:{value:4}, value2:{value:6}}});
});

test("setObj replace num to obj, obj to num", t => {
    const cfg_main = new TestConfigMain();
    const json_data = {};

    cfg_main.setObj("test", {value:1}, json_data);
    t.deepEqual(json_data, {test:{value:1}});

    cfg_main.setObj("test", 2, json_data);
    t.deepEqual(json_data, {test:2});

    cfg_main.setObj("test", {value:1}, json_data);
    t.deepEqual(json_data, {test:{value:1}});

});