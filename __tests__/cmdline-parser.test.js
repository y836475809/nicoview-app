const test = require("ava");
const { CmdLineParser } = require("../app/js/cmd-line-parser");

test("parse no option", t => {
    const clp = new CmdLineParser([
        "/bin/electron",
        "."
    ]);
    t.is(clp.get("--test", "test1"), "test1"); 
});

test("parse option", t => {
    const clp = new CmdLineParser([
        "/bin/electron",
        ".",
        "--main", "main.html",
        "--player", "player.html",
        "--debug",
    ]);
    t.is(clp.get("--main", ""), "main.html"); 
    t.is(clp.get("--player", ""), "player.html"); 
    t.is(clp.get("--debug", ""), true); 
});

test("parse option chagge order", t => {
    const clp = new CmdLineParser([
        "/bin/electron",
        ".",
        "--main", "main.html",
        "--debug",
        "--player", "player.html",   
    ]);
    t.is(clp.get("--main", ""), "main.html"); 
    t.is(clp.get("--player", ""), "player.html"); 
    t.is(clp.get("--debug", ""), true); 
});

test("parse option no value", t => {
    const clp = new CmdLineParser([
        "/bin/electron",
        ".",
        "--debug",
    ]);
    t.is(clp.get("--debug", ""), true); 
});
