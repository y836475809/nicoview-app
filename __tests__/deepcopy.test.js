const test = require("ava");

const { deepCopy } = require("../src/lib/deepcopy");

test("deepCopy number", t => {
    let obj = 1;
    let cp_obj = deepCopy(obj);
    t.is(cp_obj, 1); 
    cp_obj = 2;
    t.is(obj, 1); 
});

test("deepCopy boolean", t => {
    let obj = true;
    let cp_obj = deepCopy(obj);
    t.is(cp_obj, true); 
    cp_obj = false;
    t.is(obj, true); 
});

test("deepCopy string", t => {
    let obj = "test";
    let cp_obj = deepCopy(obj);
    t.is(cp_obj, "test"); 
    cp_obj = "cp test";
    t.is(obj, "test"); 
});

test("deepCopy null", t => {
    let obj = null;
    let cp_obj = deepCopy(obj);
    t.is(cp_obj, null); 
    cp_obj = 1;
    t.is(obj, null); 
});

test("deepCopy array", t => {
    let obj = [1,2,3];
    let cp_obj = deepCopy(obj);
    t.deepEqual(cp_obj, [1,2,3]); 
    cp_obj = [1];
    t.deepEqual(obj, [1,2,3]); 
});

test("deepCopy array obj", t => {
    let obj = [
        {num:1, str:"test1"},
        {num:2, str:"test2"},
    ];
    let cp_obj = deepCopy(obj);
    t.deepEqual(cp_obj, [
        {num:1, str:"test1"},
        {num:2, str:"test2"},
    ]); 
    cp_obj = [];
    t.deepEqual(obj, [
        {num:1, str:"test1"},
        {num:2, str:"test2"},
    ]); 
});

test("deepCopy obj", t => {
    let obj = {
        num: 1, bool: true, str: "test", ary: [1,2,3]
    };
    let cp_obj = deepCopy(obj);
    t.deepEqual(cp_obj, {
        num: 1, bool: true, str: "test", ary: [1,2,3]
    }); 
    cp_obj = {};
    t.deepEqual(obj, {
        num: 1, bool: true, str: "test", ary: [1,2,3]
    }); 
});

test("deepCopy obj nest", t => {
    let obj = {
        num: 1,
        value:{
            num: 2, bool: true,str: "test", ary: [1,2,3],
            value:{ num: 3 }
        }
    };
    let cp_obj = deepCopy(obj);
    t.deepEqual(cp_obj, {
        num: 1,
        value:{
            num: 2, bool: true,str: "test", ary: [1,2,3],
            value:{ num: 3 }
        }
    }); 
    cp_obj = {};
    t.deepEqual(obj, {
        num: 1,
        value:{
            num: 2, bool: true,str: "test", ary: [1,2,3],
            value:{ num: 3 }
        }
    }); 
});