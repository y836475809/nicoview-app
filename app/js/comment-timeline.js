const { gsap } = require("gsap/dist/gsap");
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
     * 
     * @param {Array} comments 
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
     * 
     * @param {Array} script_comments 
     * @param {Array} normal_comments 
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
     * 
     * @param {String} mail 
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
     * 
     * @param {String} mail 
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
     * 
     * @param {String} mail 
     * @param {String} user_id 
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

class CommentTimeLine {
    /**
     * 
     * @param {HTMLElement} parent_elm 
     * @param {Number} duration_sec 
     * @param {Number} row_num 
     * @param {String} comment_font_family 
     */
    constructor(parent_elm, duration_sec, row_num, comment_font_family){
        this.parent_elm = parent_elm;
        this.duration_sec = duration_sec;
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
        this._on_complete = ()=>{};
    }

    onComplete(on_complete){
        this._on_complete = on_complete;
    }

    get paused(){
        return this._paused;
    }

    get ended(){
        return this._ended;
    }

    get lastTimeSec(){
        return this._last_time_sec;
    }

    setFPS(fps){
        gsap.ticker.fps(fps);
    }

    /**
     * @param {Array} comments 
     */
    create(comments) {
        this._ended = false;
        this._createCanvas();
        this.clear();

        this.timeLine = gsap.timeline(
            {
                onComplete:()=>{
                    this._ended = true;
                    this.pause();
                    this._on_complete();
                },
                paused: true 
            }
        );

        comments.sort((a, b) => {
            if (a.vpos < b.vpos) return -1;
            if (a.vpos > b.vpos) return 1;
            return 0;
        });

        this._last_time_sec = 0;
        if(comments.length>0){
            this._last_time_sec  = 
                comments[comments.length-1].vpos/100 + this.duration_sec;
        }
        
        const [flow_comments,
            fixed_top_comments,
            fixed_bottom_comments] = this._getEachComments(comments);

        this._createFlowTL(flow_comments);
        this._createFixedTL(fixed_top_comments, fixed_bottom_comments);
    }

    /**
     * 
     * @param {Array} comments 
     */
    _createFlowTL(comments){
        const view_width = this.area_size.width;
        const duration_msec = this.duration_sec * 1000;

        const flow_cmt = new FlowComment(this.row_num, view_width, duration_msec);
        const fragment = document.createDocumentFragment();
        const row_h = this.area_size.height / this.row_num;

        const params = this._createFlowParams(comments, flow_cmt, row_h, fragment);
        this.parent_elm.appendChild(fragment);

        this._createFlowTweenMax(params);
    }
    
    _createFlowTweenMax(params){
        params.forEach((param)=>{
            const { elm, left, delay } = param; 

            const id = elm.id;                     
            this.timeLine.add(
                gsap.to(`#${id}`, {
                    duration: this.duration_sec,
                    x: left,
                    display : "block",
                    ease: "none",
                    onComplete:()=>{
                        gsap.set(`#${id}`, {display : "none"});
                    }
                }), delay);
        });
    }

    /**
     * 
     * @param {Array} top_comments 
     * @param {Array} bottom_comments 
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

    _createFixedTweenMax(params){
        params.forEach((param)=>{
            const { elm, delay, duration } = param; 

            const id = elm.id;
            this.timeLine.add(
                gsap.to(`#${id}`, {
                    duration: duration,
                    alpha: 1, 
                    display : "block",
                    onComplete:()=>{
                        gsap.set(`#${id}`, {display : "none"});
                    }
                }) ,delay );
        });
    }

    clear(){
        if(this.enable!==true){
            return;
        }
        if(!this.timeLine){
            return;
        }

        this.timeLine.kill();
        this.parent_elm.querySelectorAll(".comment").forEach(elm=>{
            this.parent_elm.removeChild(elm);
        });
        this.timeLine = null;

        this._paused = true;
    }

    play(){
        if(this.enable!==true){
            return;
        }
        this.timeLine.play();

        this._paused = false;
    }

    pause(){
        if(this.enable!==true){
            return;
        }
        this.timeLine.pause();

        this._paused = true;
    }

    seek(seek_sec){
        this._ended = false;

        if(this.enable!==true){
            return;
        }
        this.timeLine.time(seek_sec, false);
    }

    getCurrentTime(){
        return this.timeLine.time();
    }

    _createCanvas(){
        if(this.ctx){
            return;
        }
        const canvas = document.createElement("canvas");
        this.ctx = canvas.getContext("2d");
    }

    _getTextWidth(text, font_size){
        this.ctx.font = `${font_size}px ${this.comment_font_family}`;
        // 改行で分割して一番長いものを採用
        const lens = text.split(/\r\n|\n/).map(ar=>{
            return this.ctx.measureText(ar).width;
        });
        return Math.max(...lens);
    }

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
        elm.style.left = view_width + "px";
        elm.style.color = comment.color;

        return {elm, text_width};    
    }

    /**
     * 
     * @param {Array} comments 
     * @param {FlowComment} flow_cmt 
     * @param {DocumentFragment} fragment 
     */
    _createFlowParams(comments, flow_cmt, row_h, fragment){
        flow_cmt.createRowIndexMap(comments);

        return comments.map((comment, index)=>{
            const row_index = flow_cmt.getRowIndex(comment);
            const { elm, text_width } = 
                this._createElm(comment, fragment);
            const id = `flow-comment-id${index}`;
            elm.id = id;
            elm.classList.add("flow");

            const margin = (row_h - parseInt(elm.style.fontSize)) / 2;
            elm.style.top = (row_index * row_h + margin) + "px";

            const left = -(this.area_size.width + text_width);
            const delay = comment.vpos / 1000; //sec
            return { elm, left, delay };
        });
    }

    /**
     * 
     * @param {String} pos_type 
     * @param {Array} comments 
     * @param {FixedComment} fixed_cmt 
     * @param {Number} row_h 
     * @param {DocumentFragment} fragment 
     */
    _createFixedParams(pos_type, comments, fixed_cmt, row_h, fragment){
        return comments.map((comment, index)=>{
            const row_index = fixed_cmt.getRowIndex(comment);
            const { elm, text_width } = 
                this._createElm(comment, fragment);
            const id = `fixed-${pos_type}-comment-id${index}`;
            elm.id = id;
            elm.classList.add("fixed");
            const delay = comment.vpos / 1000; //sec
            elm.style.left = (this.area_size.width / 2 - text_width / 2) + "px";
            const duration = comment.duration / 1000; //sec

            const margin = (row_h - parseInt(elm.style.fontSize)) / 2;
            if(pos_type=="ue"){
                elm.style.top = (row_index * row_h + margin) + "px";
            }else if(pos_type=="shita"){
                elm.style.top = ((this.row_num - row_index - 1) * row_h + margin) + "px";
            }

            return { elm, delay, duration };
        });
    }

    /**
     * 
     * @param {Array} comments 
     */
    _getEachComments(comments) {
        const flow_comments = [];
        const fixed_top_comments = [];
        const fixed_bottom_comments = [];

        // comments.sort((a, b) => {
        //     if (a.vpos < b.vpos) return -1;
        //     if (a.vpos > b.vpos) return 1;
        //     return 0;
        // });

        const cmt_opt_parser = new CommentOptionParser();
        comments.forEach(comment=>{
            const p = {
                user_id:comment.user_id,
                no:comment.no, 
                vpos:comment.vpos*10, 
                content:comment.content, 
                duration: this.duration_sec*1000
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
        
        return [
            flow_comments, 
            fixed_top_comments, 
            fixed_bottom_comments];
    }
}

module.exports = {
    CommentTimeLine,
    CommentOptionParser,
    NicoScript
};