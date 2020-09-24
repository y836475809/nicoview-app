const test = require("ava");
const sinon = require("sinon");
const { ScheduledTask } = require("../app/js/scheduled-task");

let clock = null;
let log = [];
let count = 0;

const toMsec = (hour, minute=0) => {
    return hour*60*60*1000 + minute*60*1000;
};

const mkDate = (hour, minute) => {
    return { hour:hour, minute:minute };
};

const task = () => {
    count++;
    return {
        then:(func)=>{
            func();
        }
    };
};

test.beforeEach(t => {
    clock = sinon.useFakeTimers();
    clock.tick(toMsec(24) + new Date().getTimezoneOffset()*60*1000);
    log = [];
    count = 0;
});

test.afterEach(t => {
    clock.restore();
});

test("scheduled task", t => {
    const sk = new ScheduledTask(mkDate(3, 0),task);
    sk.on("start", ()=>{log.push("start");});
    sk.on("execute", ()=>{log.push("execute");});
    sk.on("stop", ()=>{log.push("stop");});

    sk.start();
    clock.tick(toMsec(4));
    sk.stop();

    t.is(count, 1);
    t.deepEqual(log, ["start","execute","stop"]);
});

test("scheduled task 0", t => {
    const sk = new ScheduledTask(mkDate(3, 0),task);
    sk.on("start", ()=>{log.push("start");});
    sk.on("execute", ()=>{log.push("execute");});
    sk.on("stop", ()=>{log.push("stop");});

    sk.start();
    clock.tick(toMsec(2));
    sk.stop();

    t.is(count, 0);
    t.deepEqual(log, ["start","stop"]);
});

test("scheduled task 3", t => {
    const sk = new ScheduledTask(mkDate(3, 0), task);
    sk.on("start", ()=>{log.push("start");});
    sk.on("execute", ()=>{log.push("execute");});
    sk.on("stop", ()=>{log.push("stop");});

    sk.start();
    clock.tick(toMsec(72));
    sk.stop();

    t.is(count, 3);
    t.deepEqual(log, ["start","execute","execute","execute","stop"]);
});

test("scheduled task next day", t => {
    clock.tick(toMsec(4));

    const sk = new ScheduledTask(mkDate(3, 0), task);
    sk.on("start", ()=>{log.push("start");});
    sk.on("execute", ()=>{log.push("execute");});
    sk.on("stop", ()=>{log.push("stop");});

    sk.start();

    clock.tick(toMsec(22, 59));
    t.is(count, 0);

    clock.tick(toMsec(0, 1));
    t.is(count, 1);

    sk.stop();

    t.is(count, 1);
    t.deepEqual(log, ["start","execute","stop"]);
});

test("scheduled task minute", t => {
    const sk = new ScheduledTask(mkDate(3, 1), task);
    sk.on("start", ()=>{log.push("start");});
    sk.on("execute", ()=>{log.push("execute");});
    sk.on("stop", ()=>{log.push("stop");});

    sk.start();

    clock.tick(toMsec(3));
    t.is(count, 0);

    clock.tick(toMsec(0, 1));
    t.is(count, 1);

    clock.tick(toMsec(0, 1));
    sk.stop();

    t.is(count, 1);
    t.deepEqual(log, ["start","execute","stop"]);
});

test("scheduled task repeat", async (t) => {
    const sk = new ScheduledTask(mkDate(3, 1), task);
    sk.on("start", ()=>{log.push("start");});
    sk.on("execute", ()=>{log.push("execute");});
    sk.on("stop", ()=>{log.push("stop");});

    sk.start();

    clock.tick(toMsec(4));
    t.is(count, 1);

    clock.tick(toMsec(24));
    t.is(count, 2);

    clock.tick(toMsec(24));
    t.is(count, 3);

    sk.stop();

    t.deepEqual(log, [
        "start","execute","execute", "execute", "stop"
    ]);
});