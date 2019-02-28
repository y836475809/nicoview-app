const querystring = require("querystring");

class NicoSearch {
    constructor(){
        this._service = "video";
        this._limit = 32;
        this._fields = [
            "contentId","title","description","tags",
            "viewCounter","commentCounter","startTime", 
            "thumbnailUrl","lengthSeconds"];
    }

    _query(){
        return {
            service: this._service,
            q: this._word,
            targets: this.targets.join(","),
            fields: this._fields.join(","),
            _sort: this._sort,
            _offset: this._limit * (this._page - 1),
            _limit: this._limit,
            _context: "test"
        };
    }

    query(){
        return querystring.stringify(this._query());
    }

    keyword(word){
        this._word = word;
        this.targets = ["title", "description", "tags"];
    }

    tag(word){
        this._word = word;
        this.targets = ["tagsExact"];
    }

    page(num_page){
        this._page = num_page;
    }
    
    sortKind(kind){
        this._sort_kind = kind;
    }
    sortOder(order){
        this._sort_order = order;
    }
}