const test = require("ava");
const { CommentTimeLine } = require("../app/js/comment-timeline");

class McokElement {
    constructor(name){
        this.id = "";
        this.name = name;
        this.classes = [];
        this.classList = {
            add:(name)=>{
                this.classes.push(name);
            }
        };
        this.innerText = "";
        this.style = {
            display:"",
            whiteSpace:"",
            position:"",
            top:"",
            left:"",
            color:""
        };
        this.clientWidth = 300;
        this.clientHeight = 300;
    }
    appendChild(elm){}
}

class MockDocument {
    createElement(name){
        return new McokElement(name);
    }
    createDocumentFragment(){
        return new McokElement("fragment");
    }
}

global.document = new MockDocument();

class TestCommentTimeLine extends CommentTimeLine {
    _createCanvas(){}
    clear(){}
    _getTextWidth(text, font_size){
        return 100;
    }
    _createFlowTweenMax(params){
        this.flow_params = params;
    }
    _createFixedTweenMax(params){
        this.fixed_params = params;
    }
}

test("1 flow comment", t => {
    const parent = new McokElement("parent");
    const duration = 4;
    const row_num = 12;
    const comments = [
        {     
            no:1, 
            vpos:10,
            mail:"",
            text:"text", 
            user_id:"a",
        }
    ];
    const ctl = new TestCommentTimeLine(parent, duration, row_num);
    ctl.create(comments);

    t.is(ctl.flow_params.length, 1);

    const elm = ctl.flow_params[0].elm;   
    t.deepEqual(elm.style,            
        {
            display:"none",
            whiteSpace:"nowrap",
            position:"absolute",
            fontSize: "15px",
            top:"0px",
            left:300+"px",
            color: "#FFFFFF"
        });
    t.is(elm.id, "flow-comment-id0");
    t.is(elm.innerText, "text");
    t.deepEqual(elm.classes, ["comment", "flow"]);
    t.is(ctl.flow_params[0].left, -400);
    t.is(ctl.flow_params[0].delay, 0.1);
});