const { FlowComment } = require("./flow-comment");
const { FixedComment } = require("./fixed-comment");

class NicoScript {
    constructor(){
        const scripts = [
            "[@＠]デフォルト",
            "@置換",
            "@逆",
            "@コメント禁止",
            "@シーク禁止",
            "@ジャンプ",
            "@ピザ"
        ];
        this._scritp_re = new RegExp(scripts.join("|"), "i");

        const colors = [
            "white", 
            "red",
            "pink", 
            "orange", 
            "yellow",
            "green", 
            "cyan", 
            "blue", 
            "purple", 
            "black",
        ];
        this._color_re = new RegExp(colors.join("|"), "i");

        this._fontsize_re = new RegExp("big|middle|small", "i");
    }

    /**
     * スクリプト、通常コメントにオプションを適用して返す
     * @param {CommentItem[]} comments 
     * @returns {CommentItem[]}
     */
    getApplied(comments){
        const script_comments = comments.filter(comment => {
            return this._hasScript(comment.content);
        });
        const normal_comments = comments.filter(comment => {
            return !this._hasScript(comment.content);
        });

        const applied_comments = this._applyDefault(script_comments, normal_comments);
        return applied_comments;
    }

    /**
     * スクリプト、通常コメントにオプションを適用して返す
     * @param {CommentItem[]} script_comments 
     * @param {CommentItem[]} normal_comments 
     * @returns {CommentItem[]}
     */
    _applyDefault(script_comments, normal_comments){
        const f = script_comments.find(comment => {
            return /[@＠]デフォルト/ig.test(comment.content);
        });
        if(f===undefined){
            return normal_comments;
        }

        const color = this._color_re.exec(f.mail);
        const font_size = this._fontsize_re.exec(f.mail);
        const opt = {};
        if(color){
            Object.assign(opt, {color:color[0]});
        }
        if(font_size){
            Object.assign(opt, {font_size:font_size[0]});
        }
        
        if( Object.keys(opt).length === 0){
            return normal_comments;
        }
        return normal_comments.map(comment => {
            const mail = comment.mail;
            const opts = [];
            if(mail){
                opts.push(mail);
            }
            if(this._color_re.test(mail)===false && opt.color){
                opts.push(opt.color);
            }
            if(this._fontsize_re.test(mail)===false && opt.font_size){
                opts.push(opt.font_size);
            }
            comment.mail = opts.join(" ");
            return comment;
        });
    }

    /**
     * スクリプトかどうかを判定する
     * @param {string} text 
     * @returns {boolean} true:スクリプトと判定
     */
    _hasScript(text){
        return this._scritp_re.test(text);
    }
}

class CommentOptionParser {
    constructor(){
        this._default_color = "white";

        this._p_color_map = new Map([
            ["niconicowhite", "#CCCC99"],
            ["white2", "#CCCC99"],
            ["truered", "#CC0033"],
            ["red2", "#CC0033"],
            ["pink2", "#FF33CC"],
            ["passionorange", "#FF6600"],
            ["orange2", "#FF6600"],
            ["madyellow", "#999900"],
            ["yellow2", "#999900"],
            ["elementalgreen", "#00CC66"],
            ["green2", "#00CC66"],
            ["cyan2", "#00CCCC"],
            ["marineblue", "#3399FF"],
            ["blue2", "#3399FF"],
            ["nobleviolet", "#6633CC"],
            ["purple2", "#6633CC"],
            ["black2", "#666666"]
        ]);
        this._u_color_map = new Map([
            ["white", "#FFFFFF"],
            ["red", "#FF0000"],
            ["pink", "#FF8080"],
            ["orange", "#FFCC00"],
            ["yellow", "#FFFF00"],
            ["green", "#00FF00"],
            ["cyan", "#00FFFF"],
            ["blue", "#0000FF"],
            ["purple", "#C000FF"],
            ["black", "#000000"]
        ]);

        this._p_color_regex = this._create(this._p_color_map);
        this._u_color_regex = this._create(this._u_color_map);        
    }

    _create(color_map){
        const keys = [];
        color_map.forEach((value, key)=>{
            keys.push(key);
        });
        return new RegExp(keys.join("|"), "i");
    }

    _getColorCode(mail, color_map, color_regex){
        const color = color_regex.exec(mail);
        if(color!=null){
            if(color_map.has(color[0])===true){
                return color_map.get(color[0]);
            } 
        }
        return null;
    }

    /**
     * コメント位置(ue,shita,naka)をmailから取得して返す
     * @param {String} mail 
     * @returns {string|null} コメント位置
     */
    _getType(mail){
        const type = mail.match(/^ue\s|\sue\s|\sue$|^naka\s|\snaka\s|\snaka$|^shita\s|\sshita\s|\sshita$/gi);
        if(type!==null){
            return type[0].trim();
        }
        if(mail=="ue" || mail=="naka" || mail=="shita"){
            return mail;
        }
        return null;
    }

    /**
     * コメントのフォントサイズ(big,middle,small)を返す
     * @param {String} mail 
     * @returns {string|null} フォントサイズ
     */
    _getFontSize(mail){
        const size = mail.match(/^big\s|\sbig\s|\sbig$|^middle\s|\smiddle\s|\smiddle$|^small\s|\ssmall\s|\ssmall$/gi);
        if(size!==null){
            return size[0].trim();
        }
        if(mail=="big" || mail=="middle" || mail=="small"){
            return mail;
        }
        return null;
    }

    /**
     * オプション(mail)をパースして各情報(位置、フォントサイズ等)を返す
     * @param {String} mail 
     * @param {String} user_id 
     * @returns {{type:string, font_size:string, color:string}}
     */
    parse(mail, user_id){
        const options = {
            type: "naka",
            font_size:"middle",
            color: this._u_color_map.get(this._default_color)
        };

        if(mail){
            const normalized_mail = mail.replace(/\u3000/g, "\x20");

            const type = this._getType(normalized_mail);
            if(type!==null){
                options.type = type;
            }

            const size = this._getFontSize(normalized_mail);
            if(size!==null){
                options.font_size = size;
            }

            if(user_id=="owner"){
                const duration = /\s*@\d+\s*/.exec(normalized_mail);
                if(duration){
                    const sec = parseInt(duration[0].replace("@", ""));
                    Object.assign(options, { duration:sec*1000 });
                }
            }

            const p_color_code = this._getColorCode(
                normalized_mail, this._p_color_map, this._p_color_regex);
            if(p_color_code!==null){
                options.color = p_color_code;
                return options;
            }

            const u_color_code = this._getColorCode(
                normalized_mail, this._u_color_map, this._u_color_regex);
            if(u_color_code!==null){
                options.color = u_color_code;
                return options;
            }

            const color_code = normalized_mail.match(/#[a-f0-9]{6}/ig);
            if(color_code!==null){
                options.color = color_code[0];
                return options;
            }
        }
        return options;
    }
}

class TimeLine {
    constructor(duration_ms){
        this._duration_ms = duration_ms;

        /** @type {Animation[]} */
        this._comments = [];

        /** @type {Map<string, HTMLElement>} */
        this._em_map = new Map();

        this._current_time_ms = 0;
        this._last_time_ms = 0;
        this._interval_id = 0;
        this._interval_ms = 100;
        this._start_index = 0; 
    }

    get current_time_ms(){
        return this._current_time_ms;
    } 
    
    set last_time_ms(value){
        this._last_time_ms = value;
    } 

    onComplete(on_complete){
        this._on_complete = on_complete;
    }

    clear(){
        this._clearInterval();
        this._current_time_ms = 0;
        this._start_index = 0;
        this._comments.forEach(ani=>{
            ani.cancel();
        });
        this._comments = [];
        this._em_map.clear();
    }

    play(){
        if(this._interval_id){
            return;
        }
        let current_time = Date.now();
        this._interval_id = Number(setInterval(() => {
            this._current_time_ms += Date.now() - current_time;
            current_time = Date.now();

            this._updateAnimetion();   
            if(this._current_time_ms >= this._last_time_ms + 100){
                this._clearInterval();
                if(this._on_complete){
                    this._on_complete();
                }
            }  
        }, this._interval_ms));  
    }

    _updateAnimetion(){
        for(let i=this._start_index; i< this._comments.length; i++){
            const ani = this._comments[i];
            const delay = ani.effect.getTiming().delay;
            const pre = delay + this._duration_ms + 500;
            if(this._current_time_ms > pre){
                this._start_index = i;
                const style = this._em_map.get(ani.id).style;
                if(style.display == "block"){
                    style.display = "none";
                }
                continue;
            }    
            if(this._current_time_ms + 1000 < delay){
                break;
            }

            const style = this._em_map.get(ani.id).style;
            if(style.display == "none"){
                style.display = "block";
            }
            ani.currentTime = this._current_time_ms;
        } 
    }

    _clearInterval(){
        clearInterval(this._interval_id);
        this._interval_id = 0;
    }

    pause(){
        this._clearInterval();
    }

    seek(seek_sec){
        const seek_ms = seek_sec*1000;
        this._current_time_ms = seek_ms;
        this._start_index = 0;
        this._comments.forEach(ani=>{
            this._em_map.get(ani.id).style.display = "none";
        }); 
        this._updateAnimetion();
    }

    createFlow(params){
        params.forEach((param)=>{
            const { elm, left, delay } = param;
            this._em_map.set(elm.id, elm);
            const move = elm.animate(
                [
                    { transform: `translateX(${left}px)` }
                ],
                {
                    duration: this._duration_ms,
                    delay: delay*1000,
                }
            );
            move.id = elm.id;
            move.cancel();
            this._comments.push(move);
        });
    }

    createFix(params){
        params.forEach((param)=>{
            const { elm, delay, pos } = param;
            this._em_map.set(elm.id, elm);
            const move = elm.animate(
                [
                    { transform: `translateX(${-pos}px)` },
                ],
                {
                    duration: this._duration_ms,
                    easing: "step-start",
                    delay: delay*1000,
                }
            );
            move.id = elm.id;
            move.cancel();
            this._comments.push(move);
        });
    }

    sortComments(){
        this._comments.sort((a, b) => {
            const a_delay = a.effect.getTiming().delay;
            const b_delay = b.effect.getTiming().delay;
            if (a_delay < b_delay) return -1;
            if (a_delay > b_delay) return 1;
            return 0;
        });
    }
}

class NicoCommentTimeLine {
    constructor(parent_elm, duration_sec, row_num, comment_font_family){
        this.parent_elm = parent_elm;
        this.row_num = row_num;
        this.comment_font_family = comment_font_family;
        this.ctx = null;
        this.area_size = {
            height: parent_elm.clientHeight,
            width: parent_elm.clientWidth
        };
        this.timeLine = null;
        this.enable = true;
        this._last_time_sec = 0;

        this._paused = true;
        
        this._ended = false;
        this._has_comment = true;
        this._on_complete = ()=>{};

        this._duration_ms = duration_sec*1000;
        /** @type {TimeLine} */
        this._timeline = new TimeLine(this._duration_ms);
    }

    onComplete(on_complete){
        this._on_complete = on_complete;
    }

    /**
     * コメントが一時停止しているかどうかを判定する
     * @returns {boolean} true:一時停止中
     */
    get paused(){
        return this._paused;
    }

    /**
     * コメントが終わっているかどうかを判定する
     * @returns {boolean} true:コメントが終わっている
     */
    get ended(){
        return this._ended;
    }

    /**
     * コメントがあるかどうかを判定する
     * @returns {boolean} true:コメントがある
     */
    get hasComment(){
        return this._has_comment;
    }

    /**
     * 最後のコメントが消える時点の時間を返す
     * @returns {number}
     */
    get lastTimeSec(){
        return this._last_time_sec;
    }

    setFPS(fps){
        this._timeline._interval_ms = 1000/fps;
    }

    create(comments) {
        this._has_comment = comments.length > 0;
        this._ended = false;
        this._createCanvas();
        this.clear();
        
        if(!this._timeline){
            this._timeline = new TimeLine(this._duration_ms);
        }
        this._timeline.onComplete(this._on_complete);

        comments.sort((a, b) => {
            if (a.vpos < b.vpos) return -1;
            if (a.vpos > b.vpos) return 1;
            return 0;
        });

        this._last_time_sec = 0;
        if(comments.length>0){
            this._last_time_sec  = 
                comments[comments.length-1].vpos/100 + this._duration_ms/1000;
        }
        this._timeline.last_time_ms = this._last_time_sec * 1000;
        
        const {flow_comments,
            fixed_top_comments,
            fixed_bottom_comments} = this._getEachComments(comments);

        this._createFlowTL(flow_comments);
        this._createFixedTL(fixed_top_comments, fixed_bottom_comments);

        this._timeline.sortComments();
    }

    /**
     * 通常(流れる)コメント要素生成
     * @param {CommentElm[]} comments 通常コメントリスト
     */
    _createFlowTL(comments){
        const view_width = this.area_size.width;

        const flow_cmt = new FlowComment(this.row_num, view_width, this._duration_ms);
        const fragment = document.createDocumentFragment();
        const row_h = this.area_size.height / this.row_num;

        const params = this._createFlowParams(comments, flow_cmt, row_h, fragment);
        this.parent_elm.appendChild(fragment);

        this._createFlowTweenMax(params);
    }

    /**
     * 固定コメント要素を生成
     * @param {CommentElm[]} top_comments 上固定コメントリスト
     * @param {CommentElm[]} bottom_comments 下固定コメントリスト
     */
    _createFixedTL(top_comments, bottom_comments){
        const fixed_top_cmt = new FixedComment(this.row_num);
        fixed_top_cmt.createRowIndexMap(top_comments);

        const fixed_bottom_cmt = new FixedComment(this.row_num);
        fixed_bottom_cmt.createRowIndexMap(bottom_comments);

        const row_h = this.area_size.height / this.row_num;
        const fragment = document.createDocumentFragment();
        const fixed_top_params = this._createFixedParams("ue", top_comments, fixed_top_cmt, row_h, fragment);
        const fixed_bottom_params = this._createFixedParams("shita", bottom_comments, fixed_bottom_cmt, row_h, fragment);
        const params = fixed_top_params.concat(fixed_bottom_params);

        this.parent_elm.appendChild(fragment);

        this._createFixedTweenMax(params);
    }


    _createFlowTweenMax(params){
        this._timeline.createFlow(params);
    }

    _createFixedTweenMax(params){
        this._timeline.createFix(params);
    }

    _createFlowParams(comments, flow_cmt, row_h, fragment){
        flow_cmt.createRowIndexMap(comments);

        return comments.map((comment, index) => {
            const row_index = flow_cmt.getRowIndex(comment);
            const { elm, text_width } = this._createElm(comment, fragment);
            const id = `flow-comment${index}`;
            elm.id = id;
            const margin = (row_h - parseInt(elm.style.fontSize)) / 2;
            elm.style.top = (row_index * row_h + margin) + "px";

            const left = -(this.area_size.width + text_width);
            const delay = comment.vpos / 1000; //sec
            return { elm, left, delay };
        });
    }

    _createFixedParams(pos_type, comments, fixed_cmt, row_h, fragment){
        return comments.map((comment, index) => {
            const row_index = fixed_cmt.getRowIndex(comment);
            const { elm, text_width } = this._createElm(comment, fragment);
            const id = `fixed-${pos_type}-comment${index}`;
            elm.id = id;
            const delay = comment.vpos / 1000; //sec
            const pos = (this.area_size.width / 2 + text_width / 2);
            elm.style.left = (this.area_size.width + 5) + "px";

            const margin = (row_h - parseInt(elm.style.fontSize)) / 2;
            if(pos_type=="ue"){
                elm.style.top = (row_index * row_h + margin) + "px";
            }else if(pos_type=="shita"){
                elm.style.top = ((this.row_num - row_index - 1) * row_h + margin) + "px";
            }

            return { elm, delay, pos };
        });
    }

    /**
     * fragmentにコメント要素を追加してその要素を返す
     * @param {CommentElm} comment 
     * @param {DocumentFragment} fragment 
     * @returns {{elm:HTMLDivElement, text_width:number}}
     */
    _createElm(comment, fragment){
        const elm = document.createElement("div");
        elm.classList.add("comment");

        // 半角空白が連続していたら一つにまとめられてしまうので
        // 2個連続している半角空白を全角空白に置き換える
        elm.innerText = comment.content.replace(/(\s)\1/g, "\u3000");

        elm.style.display = "none";
        elm.style.whiteSpace = "nowrap";
        elm.style.position = "absolute";
        
        fragment.appendChild(elm);

        const view_height = this.area_size.height;
        const view_width = this.area_size.width;

        let font_size = Math.floor(view_height/20);
        if(comment.font_size=="big"){
            font_size = Math.floor(view_height/15);
        }else if(comment.font_size=="small"){
            font_size = Math.floor(view_height/25);
        }
        
        const text_width = this._getTextWidth(comment.content, font_size);

        elm.style.fontSize = font_size + "px";
        elm.style.left = (view_width + 5) + "px";
        elm.style.color = comment.color;

        return {elm, text_width};    
    }

    clear(){
        if(this.enable!==true){
            return;
        }
        if(!this._timeline){
            return;
        }

        this._timeline.clear();
        this.parent_elm.querySelectorAll(".comment").forEach(elm=>{
            this.parent_elm.removeChild(elm);
        });
        this._timeline = null;

        this._paused = true;
    }

    play(){
        if(this.enable!==true){
            return;
        }
        this._paused = false;
        this._timeline.play();
    }

    pause(){
        if(this.enable!==true){
            return;
        }
        this._timeline.pause();
        this._paused = true;
    }

    /**
     * 
     * @param {number} seek_sec 
     * @returns {void}
     */
    seek(seek_sec){
        if(seek_sec < this.lastTimeSec){
            this._ended = false;
        }else{
            this._ended = true;
        }   

        if(this.enable!==true){
            return;
        }
        this._timeline.seek(seek_sec);
    }

    /**
     * 現在の再生時刻を返す
     * @returns {number}
     */
    getCurrentTime(){
        return this._timeline.current_time_ms / 1000;
    }

    _createCanvas(){
        if(this.ctx){
            return;
        }
        const canvas = document.createElement("canvas");
        this.ctx = canvas.getContext("2d");
    }
    
    /**
     * コメント本文の長さを返す
     * @param {string} text コメント本文
     * @param {number} font_size フォントサイズ
     * @returns コメント本文の長さ
     */
    _getTextWidth(text, font_size){
        this.ctx.font = `${font_size}px ${this.comment_font_family}`;
        // 改行で分割して一番長いものを採用
        const lens = text.split(/\r\n|\n/).map(ar=>{
            return this.ctx.measureText(ar).width;
        });
        return Math.max(...lens);
    }

    /**
     * コメントリストから通常、上固定、下固定コメント要素リストを生成する
     * @param {CommentItem[]} comments コメントリスト
     * @returns {{
     * flow_comments:CommentElm[],
     * fixed_top_comments:CommentElm[],
     * fixed_bottom_comments:CommentElm[]
     * }}
     */
    _getEachComments(comments) {
        const flow_comments = [];
        const fixed_top_comments = [];
        const fixed_bottom_comments = [];

        const cmt_opt_parser = new CommentOptionParser();
        comments.forEach(comment=>{
            const p = {
                user_id:comment.user_id,
                no:comment.no, 
                vpos:comment.vpos*10, 
                content:comment.content, 
                duration: this._duration_ms
            };
            const opts = cmt_opt_parser.parse(comment.mail, comment.user_id);
            Object.assign(p, opts);  

            if(p.type=="ue"){
                fixed_top_comments.push(p);
            }else if(p.type=="shita"){
                fixed_bottom_comments.push(p);
            }else{
                flow_comments.push(p);
            }
        }); 
        
        return {
            flow_comments, 
            fixed_top_comments, 
            fixed_bottom_comments
        };
    }
}

module.exports = {
    NicoCommentTimeLine,
    CommentOptionParser,
    NicoScript
};