const { NicoClientRequest } = require("./nico-client-request");
const querystring = require("querystring");

const sortNames = [
    "viewCounter",
    "mylistCounter",
    "commentCounter",
    "startTime",
    "lastCommentTime",
    "lengthSeconds",
];
const sortOrders = [ "+","-"];

const searchItems = Object.freeze({
    sortItems: [
        {title: "投稿日が新しい順", name:"startTime",order:"-"},
        {title: "再生数が多い順", name:"viewCounter",order:"-"},
        {title: "コメントが多い順", name:"commentCounter",order:"-"},
        {title: "投稿日が古い順", name:"startTime",order:"+"},
        {title: "再生数が少ない順", name:"viewCounter",order:"+"},
        {title: "コメントが少ない順", name:"commentCounter",order:"+"}
    ],       
    searchTargetItems: [
        {title: "タグ", target:"tag"},
        {title: "キーワード", target:"keyword"},
    ]
});

class NicoSearchParams {
    constructor(limit=32){
        this._service = "video";
        this._query = "";
        this._sort = "";
        this._page = 1;
        this._limit = limit;
        this._targets = [];
        this._fields = [
            "contentId","title","description","tags",
            "viewCounter","commentCounter","startTime", 
            "thumbnailUrl","lengthSeconds"];
    }

    get(){
        this._validation();

        return {
            q: this._query,
            targets: this._targets.join(","),
            fields: this._fields.join(","),
            _sort: `${this._sort_order}${this._sort_name}`,
            _offset: this._calcOffset(),
            _limit: this._limit,
            _context: "electron-app"
        };
    }

    getParams(){
        return {
            query: this._query,
            sort_name: this._sort_name,
            sort_order: this._sort_order,
            search_target: this._search_target,
            page: this._page
        };
    }

    service(name){
        this._service = name;
    }

    query(query){
        this._query = query;
        this._resetParams();
    }

    isQueryEmpty(){
        return this._query.length === 0;
    }

    target(kind){
        this._search_target = kind;
        if(kind=="keyword"){
            this._targets = ["title", "description", "tags"];
            this._resetParams();
        }else if(kind=="tag"){
            this._targets = ["tagsExact"];
            this._resetParams();
        }else{
            throw new Error("キーワードまたはタグが選択されていない");
        }
    }

    page(num){
        this._page = num;
    }
    
    sortName(name){
        this._sort_name = name;
        this._resetParams();
    }
    sortOder(order){
        this._sort_order = order;
        this._resetParams();
    }

    _calcOffset(){
        return this._limit * (this._page - 1);
    }

    _validation(){
        const msgs = [];
        if(this._query == ""){
            msgs.push("検索語が空");
        }
        if(!sortNames.includes(this._sort_name)){
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
}

class NicoSearch {
    constructor() { 
        this._req = null;
    }

    cancel(){   
        if (this._req) {
            this._req.cancel();
        }
    }

    search(params){   
        const service = params._service;
        const query_json = params.get();
        const host = "https://api.search.nicovideo.jp";
        const url = `${host}/api/v2/${service}/contents/search`;
        const page = params._page;
        
        return new Promise(async (resolve, reject) => {
            this._req = new NicoClientRequest();
            try {
                const body = await this._req.get(`${url}?${querystring.stringify(query_json)}`);
                const result = JSON.parse(body);
                result.meta.page = page;
                resolve(result);       
            } catch (error) {
                if(error.status){
                    let message = `status=${error.status}, エラー`;
                    if(error.status === 400){
                        message = `status=${error.status}, 不正なパラメータです`; 
                    }else if(error.status === 404){
                        message = `status=${error.status}, ページが見つかりません`; 
                    }else if(error.status === 500){
                        message = `status=${error.status}, 検索サーバの異常です`; 
                    }else if(error.status === 503){
                        message = `status=${error.status}, サービスがメンテナンス中です`; 
                    }    
                    reject(new Error(message));                     
                }else{
                    reject(error);     
                }
            }    
        });
    }
}

module.exports = {
    NicoSearchParams,
    NicoSearch,
    searchItems
};