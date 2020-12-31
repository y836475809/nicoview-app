const test = require("ava");
const { Config } = require("../app/js/config");

class TestConfig extends Config {
    setup(){}
}

test("getObj json_data empty", t => {
    const config = new TestConfig();
    const json_data = {};
    t.is(config._getObj("test", json_data), undefined);
    t.deepEqual(json_data, {});
});

test("get default value", t => {
    const config = new TestConfig();
    
    config.json_data = {};
    t.deepEqual(config.get(
        "test", 
        {value1:20, value2:"val2", value3:{}}
    ), {value1:20, value2:"val2", value3:{}});

    config.json_data = {test:{value1:10}};
    t.deepEqual(config.get(
        "test", 
        {value1:20, value2:"val2", value3:{}}
    ), {value1:10, value2:"val2", value3:{}});
});

test("getObj json_data has obj", t => {
    const config = new TestConfig();
    const json_data = {test: {value1:10, value2:"val2", value3:{}}};

    t.deepEqual(config._getObj("test", json_data), {value1:10, value2:"val2", value3:{}});
    t.is(config._getObj("test.value1", json_data), 10);
    t.is(config._getObj("test.value2", json_data), "val2");
    t.deepEqual(config._getObj("test.value3", json_data), {});
    t.is(config._getObj("test.value4", json_data), undefined);
    t.is(config._getObj("test.value1.value1", json_data), undefined);

    t.deepEqual(json_data, {test:{value1:10, value2:"val2", value3:{}}});
});

test("setObj add", t => {
    const config = new TestConfig();
    const json_data = {};

    config._setObj("test", 1, json_data);
    t.deepEqual(json_data, {test:1});

    config._setObj("test", 2, json_data);
    t.deepEqual(json_data, {test:2});

    config._setObj("test.value1", 3, json_data);
    t.deepEqual(json_data, {test:{value1:3}});

    config._setObj("test.value1", 4, json_data);
    t.deepEqual(json_data, {test:{value1:4}});

    config._setObj("test.value2", 5, json_data);
    t.deepEqual(json_data, {test:{value1:4, value2:5}});

    config._setObj("test.value2", 6, json_data);
    t.deepEqual(json_data, {test:{value1:4, value2:6}});
    
    config._setObj("test", {value3:7}, json_data);
    t.deepEqual(json_data, {test:{value1:4, value2:6, value3:7}});
});

test("setObj replace obj", t => {
    const config = new TestConfig();
    const json_data = {};

    config._setObj("test", {value:1}, json_data);
    t.deepEqual(json_data, {test:{value:1}});

    config._setObj("test", {value:2}, json_data);
    t.deepEqual(json_data, {test:{value:2}});

    config._setObj("test.value1", {value:3}, json_data);
    t.deepEqual(json_data, {test:{value:2, value1:{value:3}}});

    config._setObj("test.value1", {value:4}, json_data);
    t.deepEqual(json_data, {test:{value:2, value1:{value:4}}});

    config._setObj("test.value2", {value:5}, json_data);
    t.deepEqual(json_data, {test:{value:2, value1:{value:4}, value2:{value:5}}});

    config._setObj("test.value2", {value:6}, json_data);
    t.deepEqual(json_data, {test:{value:2, value1:{value:4}, value2:{value:6}}});
});

test("setObj replace num to obj, obj to num", t => {
    const config = new TestConfig();
    const json_data = {};

    config._setObj("test", {value:1}, json_data);
    t.deepEqual(json_data, {test:{value:1}});

    config._setObj("test", 2, json_data);
    t.deepEqual(json_data, {test:2});

    config._setObj("test", {value:1}, json_data);
    t.deepEqual(json_data, {test:{value:1}});

});