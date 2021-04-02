const { NicoClientRequest } = require("./nico-client-request");
const { NICO_URL } = require("./nico-url");
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
    constructor(limit=32, context="electron-app"){
        this._service = "video";
        this._query = "";
        this._sort = "";
        this._page = 1;
        this._limit = limit;
        this._targets = [];
        this._fields = [
            "contentId","title","tags",
            "viewCounter","commentCounter","startTime", 
            "thumbnailUrl","lengthSeconds"];
        this._context = context;
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
            _context: this._context
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

    async search(params){   
        const service = params._service;
        const query_json = params.get();
        const url = `${NICO_URL.SEARCH}/api/v2/${service}/contents/search`;
        const page = params._page;
        
        this._req = new NicoClientRequest();
        try {
            const body = await this._req.get(`${url}?${querystring.stringify(query_json)}`);
            const result = JSON.parse(body);

            const search_offset = 1600;
            const search_limit = 32;

            const search_result_num = result.meta.totalCount;
            let total_page_num = 0;
            if(search_result_num < search_offset+search_limit){
                total_page_num = Math.ceil(search_result_num / search_limit);
            }else{
                total_page_num = Math.ceil((search_offset+search_limit) / search_limit);
            }

            const search_result = {};
            search_result.page_ifno = {
                page_num: page, 
                total_page_num: total_page_num, 
                search_result_num: search_result_num
            };
            search_result.list = result.data.map(value => {
                return {
                    thumbnailUrl: value.thumbnailUrl,
                    contentId: value.contentId,
                    title: value.title,
                    viewCounter: value.viewCounter,
                    commentCounter: value.commentCounter,
                    lengthSeconds: value.lengthSeconds,
                    startTime: value.startTime,
                    tags: value.tags,
                };
            });

            return search_result;
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
                throw new Error(message);                     
            }else{
                throw error;     
            }
        }
    }
}

module.exports = {
    NicoSearchParams,
    NicoSearch,
    searchItems
};