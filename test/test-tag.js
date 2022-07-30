const { MyObservable } = require("../app/js/my-observable");
const obs = new MyObservable();

const createModalFunc = (msg, buttons) => {
    return () => {
        obs.trigger("show", {
            message: msg,
            buttons: buttons,
            cb: ()=>{
                obs.trigger("close");
            }
        });
    };
};

const setup = () => {
    const btn1 = document.getElementById("test-modal1");
    btn1.onclick = createModalFunc("ok cancel", ["ok", "cancel"]);

    const btn2 = document.getElementById("test-modal2");
    btn2.onclick = createModalFunc("ok", ["ok"]);

    const btn3 = document.getElementById("test-modal3");
    btn3.onclick = createModalFunc("cancel", ["cancel"]);

    const btn4 = document.getElementById("test-modal4");
    btn4.onclick = createModalFunc("msg");
};

module.exports = {
    obs,
    setup,
};