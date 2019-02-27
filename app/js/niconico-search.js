const querystring = require("querystring");

const q = {
    service: "video",
    q: "word",
    targets: ["title", "description", "tags"].join(","),
    fields:  [
        "contentId","title","description","tags",
        "viewCounter","commentCounter","startTime", 
        "thumbnailUrl","lengthSeconds"].join(","),
    _sort: this._sort,
    _offset: this._size * (this._page - 1),
    _limit: this._size,
    _context: "test"
};