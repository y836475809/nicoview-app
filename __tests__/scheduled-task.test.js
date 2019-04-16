const test = require("ava");
const sinon = require("sinon");
const { ScheduledTask } = require("../app/js/scheduled-task");

let clock = null;
test.beforeEach(t => {
    clock = sinon.useFakeTimers();
});

test.afterEach(t => {
    clock.restore();
});


test("scheduled task", async (t) => {
    
});