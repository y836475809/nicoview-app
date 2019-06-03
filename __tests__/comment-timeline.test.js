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

test.beforeEach(t => {
    const parent = new McokElement("parent");
    const duration = 4;
    const row_num = 12;
    t.context.ctl = new TestCommentTimeLine(parent, duration, row_num);
});

test("flow comments", t => {
    const comments = [
        {     
            no:1, 
            vpos:10,
            mail:"",
            text:"text", 
            user_id:"a",
        },        
        {     
            no:2, 
            vpos:20,
            mail:"red big",
            text:"text", 
            user_id:"a",
        }
    ];
    const ctl = t.context.ctl;
    ctl.create(comments);

    t.is(ctl.flow_params.length, 2);

    {
        const { elm, left, delay } = ctl.flow_params[0];
        t.deepEqual(elm.style,
            {
                display:"none",
                whiteSpace:"nowrap",
                position:"absolute",
                fontSize: "15px",
                top:(300/12*0) + "px",
                left:"300px",
                color: "#FFFFFF"
            });
        t.is(elm.id, "flow-comment-id0");
        t.is(elm.innerText, "text");
        t.deepEqual(elm.classes, ["comment", "flow"]);
        t.is(left, -400);
        t.is(delay, 0.1);
    }
    {
        const { elm, left, delay } = ctl.flow_params[1];
        t.deepEqual(elm.style,
            {
                display:"none",
                whiteSpace:"nowrap",
                position:"absolute",
                fontSize: "20px",
                top: (300/12*1) +"px",
                left:"300px",
                color: "#FF0000"
            });
        t.is(elm.id, "flow-comment-id1");
        t.is(elm.innerText, "text");
        t.deepEqual(elm.classes, ["comment", "flow"]);
        t.is(left, -400);
        t.is(delay, 0.2);
    }
});

test("fixed comments no option", t => {
    const comments = [
        {     
            no:1, 
            vpos:10,
            mail:"ue",
            text:"text", 
            user_id:"a",
        },
        {     
            no:2, 
            vpos:20,
            mail:"ue red big",
            text:"text", 
            user_id:"a",
        },
        {     
            no:3, 
            vpos:10,
            mail:"shita",
            text:"text", 
            user_id:"a",
        },
        {     
            no:4, 
            vpos:20,
            mail:"shita red big",
            text:"text", 
            user_id:"a",
        },
    ];
    const ctl = t.context.ctl;
    ctl.create(comments);

    t.is(ctl.fixed_params.length, 4);

    {
        const { elm, delay, duration } = ctl.fixed_params[0]; 
        t.deepEqual(elm.style,
            {
                display:"none",
                whiteSpace:"nowrap",
                position:"absolute",
                fontSize: "15px",
                top: (0*(300/12))+"px",
                left:"100px",
                color: "#FFFFFF"
            });
        t.is(elm.id, "fixed-ue-comment-id0");
        t.is(elm.innerText, "text");
        t.deepEqual(elm.classes, ["comment", "fixed"]);
        t.is(delay, 0.1);
        t.is(duration, 4);
    }
    {
        const { elm, delay, duration } = ctl.fixed_params[1]; 
        t.deepEqual(elm.style,
            {
                display:"none",
                whiteSpace:"nowrap",
                position:"absolute",
                fontSize: "20px",
                top: (1*(300/12))+"px",
                left:"100px",
                color: "#FF0000"
            });
        t.is(elm.id, "fixed-ue-comment-id1");
        t.is(elm.innerText, "text");
        t.deepEqual(elm.classes, ["comment", "fixed"]);
        t.is(delay, 0.2);
        t.is(duration, 4);
    }
    
    {
        const { elm, delay, duration } = ctl.fixed_params[2]; 
        t.deepEqual(elm.style,
            {
                display:"none",
                whiteSpace:"nowrap",
                position:"absolute",
                fontSize: "15px",
                top: (12-0-1)*(300/12) + "px",
                left:"100px",
                color: "#FFFFFF"
            });
        t.is(elm.id, "fixed-shita-comment-id0");
        t.is(elm.innerText, "text");
        t.deepEqual(elm.classes, ["comment", "fixed"]);
        t.is(delay, 0.1);
        t.is(duration, 4);
    }
    {
        const { elm, delay, duration } = ctl.fixed_params[3];
        t.deepEqual(elm.style,
            {
                display:"none",
                whiteSpace:"nowrap",
                position:"absolute",
                fontSize: "20px",
                top: (12-1-1)*(300/12) + "px",
                left:"100px",
                color: "#FF0000"
            });
        t.is(elm.id, "fixed-shita-comment-id1");
        t.is(elm.innerText, "text");
        t.deepEqual(elm.classes, ["comment", "fixed"]);
        t.is(delay, 0.2);
        t.is(duration, 4);
    }
});

test("nico scritp @number", t => {
    const comments = [
        {     
            no:1, 
            vpos:10,
            mail:"ue @5",
            text:"text-owner1", 
            user_id:"owner",
        },
        {     
            no:2, 
            vpos:20,
            mail:"shita @10",
            text:"text-owner2", 
            user_id:"owner",
        },
        {     
            no:3, 
            vpos:30,
            mail:"@50",
            text:"text-owner3", 
            user_id:"owner",
        },
        {     
            no:1, 
            vpos:30,
            mail:"ue @50",
            text:"text-a", 
            user_id:"a",
        }
    ];
    const ctl = t.context.ctl;
    ctl.create(comments);

    t.is(ctl.flow_params.length, 1);
    {  
        const { elm, left, delay } = ctl.flow_params[0];
        t.is(elm.id, "flow-comment-id0");
        t.is(elm.innerText, "text-owner3");
        t.deepEqual(elm.classes, ["comment", "flow"]);
        t.is(left, -400);
        t.is(delay, 0.3);
    }  

    t.is(ctl.fixed_params.length, 3);
    {
        const { elm, delay, duration } = ctl.fixed_params[0];
        t.is(elm.id, "fixed-ue-comment-id0");
        t.is(elm.innerText, "text-owner1");
        t.deepEqual(elm.classes, ["comment", "fixed"]);
        t.is(delay, 0.1);
        t.is(duration, 5);
    }
    {
        const { elm, delay, duration } = ctl.fixed_params[1];
        t.is(elm.id, "fixed-ue-comment-id1");
        t.is(elm.innerText, "text-a");
        t.deepEqual(elm.classes, ["comment", "fixed"]);
        t.is(delay, 0.3);
        t.is(duration, 4);
    }
    {
        const { elm, delay, duration } = ctl.fixed_params[2];
        t.is(elm.id, "fixed-shita-comment-id0");
        t.is(elm.innerText, "text-owner2");
        t.deepEqual(elm.classes, ["comment", "fixed"]);
        t.is(delay, 0.2);
        t.is(duration, 10);
    }
});