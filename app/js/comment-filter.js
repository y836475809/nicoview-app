const JsonStore = require("./json-store");

class CommentFilter {
    constructor(file_path){
        this._store = new JsonStore(file_path);

        //no, vpos, post_date, user_id, mail, text
        this._comments = [];
        this._ng_texts = [];
        this._ng_user_ids = [];
    }

    setComments(comments){
        this._comments = JSON.parse(JSON.stringify(comments));
    }

    getComments(){
        return this._comments.filter(comment=>{
            const has_ng_text = this._ng_texts.includes(comment.text);
            if(has_ng_text){
                return false;
            }
            const has_ng_user_id = this._ng_user_ids.includes(comment.user_id);
            if(has_ng_user_id){
                return false;
            }
            return true;
        });
    }

    addNG(args){
        const { ng_texts, ng_user_ids } = args;
        ng_texts.forEach(text => {
            if(!this._ng_texts.includes(text)){
                this._ng_texts.push(text);
            }
        });
        ng_user_ids.forEach(user_id => {
            if(!this._ng_user_ids.includes(user_id)){
                this._ng_user_ids.push(user_id);
            }
        });
    }

    deleteNG(args){
        const { ng_texts, ng_user_ids } = args;
        this._ng_texts = this._ng_texts.filter(text => {
            return !ng_texts.includes(text);
        });
        this._ng_user_ids = this._ng_user_ids.filter(user_id => {
            return !ng_user_ids.includes(user_id);
        });
    }

    getNG(){
        return {
            ng_texts: this._ng_texts, 
            ng_user_ids: this._ng_user_ids
        };
    }

    load(){
        try {
            const { ng_texts, ng_user_ids } = this._store.load();
            this._ng_texts = ng_texts;
            this._ng_user_ids = ng_user_ids;
        } catch (error) {
            this._ng_texts = [];
            this._ng_user_ids = [];
            throw error;
        }
    }

    save(){
        this._store.save(
            {
                ng_texts: this._ng_texts, 
                ng_user_ids: this._ng_user_ids
            });
    }
}

module.exports = {
    CommentFilter
};