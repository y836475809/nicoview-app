const { LibraryDB } = require("../app/js/db");

const setupLibrary = (storex) => {
    const main_store = storex.get("main");
    const library = new LibraryDB();
    library.setVideoData([
        {id:"sm1",dirpath_id:"0",tags:["tag1"]},
        {id:"sm2",dirpath_id:"1",tags:["tag2"]}
    ]);
    main_store.commit("setLibrary", library);
};

module.exports = {
    setupLibrary,
};