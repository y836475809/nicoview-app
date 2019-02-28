
const sortkinds = [
    "viewCounter",
    "mylistCounter",
    "commentCounter",
    "startTime",
    "lastCommentTime",
    "lengthSeconds",
];
const sortOrders = [ "+","-"];

class NicoSearchParams {
    constructor(){
        this._service = "video";
        this._query = "";
        this._sort = "";
        this._page = 1;
        this._limit = 32;
        this._targets = [];
        this._fields = [
            "contentId","title","description","tags",
            "viewCounter","commentCounter","startTime", 
            "thumbnailUrl","lengthSeconds"];
    }

    get(){
        this._validation();

        return {
            service: this._service,
            q: this._query,
            targets: this._targets.join(","),
            fields: this._fields.join(","),
            _sort: `${this._sort_order}${this._sort_name}`,
            _offset: this._calcOffset(),
            _limit: this._limit,
            _context: "test"
        };
    }

    _calcOffset(){
        return this._limit * (this._page - 1);
    }

    _validation(){
        const msgs = [];
        if(this._query == ""){
            msgs.push("検索語が空");
        }
        if(!sortkinds.includes(this._sort_name)){
            msgs.push(`${this._sort_name}はソートの対象外`);
        }
        if(this._targets.length==0){
            msgs.push("検索対象のフィールドが設定されていない");
        }
        if(!sortOrders.includes(this._sort_order)){
            msgs.push(`ソート順が"${this._sort_order}", ソート順は+か-`);
        }
        if(this._limit>100){
            msgs.push(`コンテンツの最大数が"${this._limit}", 最大数は100`);
        }
        if(this._page<1){ 
            msgs.push(`ページ数が"${this._page}", ページは1以上`);
        }
        const offset = this._calcOffset();
        if(offset>1600){ 
            msgs.push(`コンテンツの取得オフセットが"${offset}", 最大数は1600`);
        }

        if(msgs.length>0){
            throw new Error(msgs.join("\n"));
        }
    }

    _resetParams(){
        this._page = 1;
    }

    keyword(query){
        this._query = query;
        this._targets = ["title", "description", "tags"];
        this._resetParams();
    }

    tag(query){
        this._query = query;
        this._targets = ["tagsExact"];
        this._resetParams();
    }

    page(num){
        this._page = num;
    }
    
    sortTarget(name){
        this._sort_name = name;
        this._resetParams();
    }
    sortOder(order){
        this._sort_order = order;
        this._resetParams();
    }
}

module.exports = {
    NicoSearchParams: NicoSearchParams,
};