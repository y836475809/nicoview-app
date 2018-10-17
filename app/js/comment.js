// @ts-check

class CommentParam {
    constructor(duration) {
        /**
         * @type {{no:number, vpos:number, text:String, type:String, view_h_div_num:number, font_scale:number}[]}
         */
        this.flow_params = [];
        this.fixed_top_params = [];
        this.fixed_bottom_params = [];
        this.duration = duration;
    }

    /**
    * 
    * @param {{no:number, vpos:number, text:String, mail:String}[]} comments 
    */
    createEachParams(comments) {
        this.flow_params = [];
        this.fixed_top_params = [];
        this.fixed_bottom_params = [];

        const size_map = new Map([["big", 15],["middle", 20], ["small", 25]]);
        const scale_map = new Map([["big", 1.3],["middle", 1], ["small", 0.8]]);

        let results = [];
        comments.forEach(comment=>{
            const m_type = comment.mail.match(/ue|shita/gi);
            const m_size = comment.mail.match(/big|small/gi);
            let p = {
                no:comment.no, 
                vpos:comment.vpos*10, 
                text:comment.text, 
                type:"naka", 
                view_h_div_num:20,
                font_scale:1
            };

            if(m_size!=null){
                p.view_h_div_num = size_map.get(m_size[0]);
                p.font_scale = scale_map.get(m_size[0]);
            }

            if(m_type!=null){
                p.type = m_type[0];
                if(p.type=="ue"){
                    this.fixed_top_params.push(p);
                }else if(p.type=="shita"){
                    this.fixed_bottom_params.push(p);
                }
            }else{
                this.flow_params.push(p);
            }
        });
    }

    getFlowParams() {
        const view_width = 800;
        this.flow_params.forEach(comment=>{
            const text = comment.text;
            const scale = comment.font_scale;

            let half_num = 0;
            const half = text.match(/[\w\d !"#$%&'()\*\+\-\.,\/:;<=>?@\[\\\]^`{|}~]/gi);
            if(half){
                half_num = half.length;
            }
            const zen_num = text.length - half_num;
            const text_width = (half_num + 2*zen_num)*scale;

            const len = view_width + text_width;
            const speed = len / this.duration;

            return {
                no: comment.no, 
                vpos: comment.vpos, 
                width: text_width, 
                speed: speed,
                row_index: -1
            };
        });
    }

    getFixedTopParams() {
        return this.fixed_top_params;
    }

    getFixedBottomParams() {
        return this.fixed_bottom_params;
    }
};