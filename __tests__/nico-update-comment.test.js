const test = require("ava");
const { NicoUpdate } = require("../app/js/nico-update");

const owner_data = require("./data/owner-comment.json");
const no_owner_data = require("./data/no-owner-comment.json");

const owner_data_diff = [
    {ping: {content: "rs:0"}}, {ping: {content: "ps:0"}},
    {
        thread: {
            resultcode: 0,
            thread: "1",
            fork: 1,
            server_time: 0,
            last_res: 100,
            ticket: "0x0",
            revision: 1
        }
    },
    {global_num_res: {thread: "1",num_res: 100}},
    {
        chat: {
            thread: "1",
            fork: 1,
            no: 3,
            vpos: 30,
            date: 100,
            premium: 1,
            mail: "shita",
            content: "owner comment1"
        }
    },
    {
        thread: {
            resultcode: 0,
            thread: "2",
            server_time: 0,
            last_res: 100,
            ticket: "0x0",
            revision: 1
        }
    },
    {
        chat: {
            thread: "1",
            no: 4,
            vpos: 40,
            date: 100,
            date_usec: 0,
            premium: 1,
            anonymity: 1,
            user_id: "user1",
            mail: "184",
            content: "user comment1"
        }
    },
    {ping: {content: "pf:0"}}, {ping: {content: "rf:0"}}
];

const no_owner_data_diff = [
    {ping: {content: "rs:0"}}, {ping: {content: "ps:0"}},
    {global_num_res: {thread: "1",num_res: 100}},
    {
        thread: {
            resultcode: 0,
            thread: "1",
            server_time: 0,
            last_res: 100,
            ticket: "0x0",
            revision: 1
        }
    },
    {
        chat: {
            thread: "1",
            no: 4,
            vpos: 40,
            date: 100,
            date_usec: 0,
            premium: 1,
            anonymity: 1,
            user_id: "user1",
            mail: "184",
            content: "user comment1"
        }
    },
    {ping: {content: "pf:0"}}, {ping: {content: "rf:0"}}
];

class TestNicoUpdate extends NicoUpdate {
    constructor(current_comment_data, diff_comment_data){
        super({data_type:"json", common_filename:"test"});
        this.data = null;
        this.current_comment_data = current_comment_data;
        this.diff_comment_data = diff_comment_data;
    }
    _getCurrentCommentData(){
        return this.current_comment_data;
    }

    async _getComments(api_data, cur_comments){
        return this.diff_comment_data;
    }
    
    _writeFile(file_path, data){
        this.data = data;
    }
}

test("update no_owner+no_owner_data_diff", async(t) => {
    const nico_update = new TestNicoUpdate(no_owner_data, no_owner_data_diff);
    await nico_update._updateComment(null, {commentPath:""});

    const threads = nico_update.data.filter(value=>{
        return value.hasOwnProperty("thread");
    });
    const comments = nico_update.data.filter(value=>{
        return value.hasOwnProperty("chat");
    });

    t.is(threads.length, 1);
    t.is(comments.length, 3);

    // update
    t.is(threads[0].thread.thread, "1");
});

test("update no_owner+owner_data_diff", async(t) => {
    const nico_update = new TestNicoUpdate(no_owner_data, owner_data_diff);
    await nico_update._updateComment(null, {commentPath:""});

    const threads = nico_update.data.filter(value=>{
        return value.hasOwnProperty("thread");
    });
    const comments = nico_update.data.filter(value=>{
        return value.hasOwnProperty("chat");
    });

    t.is(threads.length, 2);
    t.is(comments.length, 4);

    t.true(threads[0].thread.hasOwnProperty("fork"));
    t.false(threads[1].thread.hasOwnProperty("fork"));

    t.false(comments[0].chat.hasOwnProperty("fork"));
    t.false(comments[1].chat.hasOwnProperty("fork"));
    t.true(comments[2].chat.hasOwnProperty("fork"));
    t.false(comments[3].chat.hasOwnProperty("fork"));
});

test("update owner+owner_data_diff", async(t) => {
    const nico_update = new TestNicoUpdate(owner_data, owner_data_diff);
    await nico_update._updateComment(null, {commentPath:""});

    const threads = nico_update.data.filter(value=>{
        return value.hasOwnProperty("thread");
    });
    const comments = nico_update.data.filter(value=>{
        return value.hasOwnProperty("chat");
    });

    t.is(threads.length, 2);
    t.is(comments.length, 7);

    t.true(threads[0].thread.hasOwnProperty("fork"));
    t.false(threads[1].thread.hasOwnProperty("fork"));

    // update
    t.is(threads[0].thread.thread, "1");
    t.is(threads[1].thread.thread, "2");

    t.true(comments[0].chat.hasOwnProperty("fork"));
    t.true(comments[1].chat.hasOwnProperty("fork"));
    t.false(comments[2].chat.hasOwnProperty("fork"));
    t.false(comments[3].chat.hasOwnProperty("fork"));
    t.false(comments[4].chat.hasOwnProperty("fork"));
    t.true(comments[5].chat.hasOwnProperty("fork"));
    t.false(comments[6].chat.hasOwnProperty("fork"));
});