const test = require("ava");
const sinon = require("sinon");
const { ScheduledTask } = require("../app/js/scheduled-task");

let clock = null;
let log = [];
let count = 0;

const HouerToMsec = (hour) => {
    return hour*60*60*1000;
};

const mkDate = (houer, minute) => {
    return { houer:houer, minute:minute };
};

test.beforeEach(t => {
    clock = sinon.useFakeTimers();
    clock.tick(HouerToMsec(24) + new Date().getTimezoneOffset()*60*1000);
    log = [];
    count = 0;
});

test.afterEach(t => {
    clock.restore();
});

test("scheduled task", t => {
    const sk = new ScheduledTask(mkDate(3, 0), ()=>{
        count++;
    });
    sk.on("start", ()=>{log.push("start");});
    sk.on("execute", ()=>{log.push("execute");});
    sk.on("stop", ()=>{log.push("stop");});

    sk.start();
    clock.tick(HouerToMsec(4));
    sk.stop();

    t.is(count, 1);
    t.deepEqual(log, ["start","execute","stop"]);
});

test("scheduled task 0", t => {
    const sk = new ScheduledTask(mkDate(3, 0), ()=>{
        count++;
    });
    sk.on("start", ()=>{log.push("start");});
    sk.on("execute", ()=>{log.push("execute");});
    sk.on("stop", ()=>{log.push("stop");});

    sk.start();
    clock.tick(HouerToMsec(2));
    sk.stop();

    t.is(count, 0);
    t.deepEqual(log, ["start","stop"]);
});

test("scheduled task 3", t => {
    const sk = new ScheduledTask(mkDate(3, 0), ()=>{
        count++;
    });
    sk.on("start", ()=>{log.push("start");});
    sk.on("execute", ()=>{log.push("execute");});
    sk.on("stop", ()=>{log.push("stop");});

    sk.start();
    clock.tick(HouerToMsec(72));
    sk.stop();

    t.is(count, 3);
    t.deepEqual(log, ["start","execute","execute","execute","stop"]);
});

test("scheduled task m", t => {
    clock.tick(HouerToMsec(4));

    const sk = new ScheduledTask(mkDate(3, 0), ()=>{
        count++;
    });
    sk.on("start", ()=>{log.push("start");});
    sk.on("execute", ()=>{log.push("execute");});
    sk.on("stop", ()=>{log.push("stop");});

    sk.start();

    clock.tick(HouerToMsec(2));
    t.is(count, 0);

    clock.tick(HouerToMsec(21)-HouerToMsec(1/60));
    t.is(count, 0);

    clock.tick(HouerToMsec(1/60));
    sk.stop();

    t.is(count, 1);
    t.deepEqual(log, ["start","execute","stop"]);
});