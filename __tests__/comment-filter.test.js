const test = require("ava");
const { CommentNG } = require("../app/js/comment-filter");

const test_comments = Object.freeze([
    {
        no: 0, vpos: 0, post_date: 0, mail: "",
        user_id: "aa",
        text: "comment11"
    },
    {
        no: 1, vpos: 1, post_date: 0, mail: "",
        user_id: "aa",
        text: "comment22"
    },
    {
        no: 2, vpos: 2, post_date: 0, mail: "",
        user_id: "aab",
        text: "comment11"
    },
    {
        no: 3, vpos: 3, post_date: 0, mail: "",
        user_id: "c",
        text: "comment111"
    }
]);

class TestCommentNG extends CommentNG{
    load(){}
    save(){}
}

test.beforeEach(t => {
    t.context.cf = new TestCommentNG();
    t.context.cf.setComments(test_comments);

    t.context.delete_cf = new TestCommentNG();
    t.context.delete_cf.addNG({ 
        ng_matching_texts: ["text1", "text2", "text3"], 
        ng_user_ids :["id1", "id2", "id3"] 
    });
});

test("add ng words, ng user ids", t => {
    const cf = t.context.cf;
    t.deepEqual(cf._ng_matching_texts, []);
    t.deepEqual(cf._ng_user_ids, []);

    cf.addNG({ ng_matching_texts: ["a"], ng_user_ids: [] });
    t.deepEqual(cf._ng_matching_texts, ["a"]);
    t.deepEqual(cf._ng_user_ids, []);

    cf.addNG({ ng_matching_texts: ["a"], ng_user_ids: [] });
    t.deepEqual(cf._ng_matching_texts, ["a"]);
    t.deepEqual(cf._ng_user_ids, []);

    cf.addNG({ ng_matching_texts: [], ng_user_ids: ["b"] });
    t.deepEqual(cf._ng_matching_texts, ["a"]);
    t.deepEqual(cf._ng_user_ids, ["b"]);
    
    cf.addNG({ ng_matching_texts: [], ng_user_ids: ["b"] });
    t.deepEqual(cf._ng_matching_texts, ["a"]);
    t.deepEqual(cf._ng_user_ids, ["b"]);

    cf.addNG({ ng_matching_texts: ["a", "b"], ng_user_ids: ["a", "b"] });
    t.deepEqual(cf._ng_matching_texts, ["a", "b"]);
    t.deepEqual(cf._ng_user_ids, ["b", "a"]);
});

test("delete ng words, ng user ids", t => {
    const cf = t.context.delete_cf;

    cf.deleteNG({ ng_matching_texts: ["text1"], ng_user_ids: [] });
    t.deepEqual(cf._ng_matching_texts, ["text2", "text3"]);
    t.deepEqual(cf._ng_user_ids, ["id1", "id2", "id3"]);

    cf.deleteNG({ ng_matching_texts: ["text3"], ng_user_ids: [] });
    t.deepEqual(cf._ng_matching_texts, ["text2"]);
    t.deepEqual(cf._ng_user_ids, ["id1", "id2", "id3"]);

    cf.deleteNG({ ng_matching_texts: [], ng_user_ids: ["id1"] });
    t.deepEqual(cf._ng_matching_texts, ["text2"]);
    t.deepEqual(cf._ng_user_ids, ["id2", "id3"]);

    cf.deleteNG({ ng_matching_texts: [], ng_user_ids: ["id3"] });
    t.deepEqual(cf._ng_matching_texts, ["text2"]);
    t.deepEqual(cf._ng_user_ids, ["id2"]);   
});

test("delete some ng words, ng user ids", t => {
    const cf = t.context.delete_cf;

    cf.deleteNG({ ng_matching_texts: ["text1", "text3"], ng_user_ids: ["id1", "id3"] });
    t.deepEqual(cf._ng_matching_texts, ["text2"]);
    t.deepEqual(cf._ng_user_ids, ["id2"]);
});

test("delete empty ng words, ng user ids", t => {
    const cf = t.context.delete_cf;

    cf.deleteNG({ 
        ng_matching_texts: ["text1", "text2", "text3"], 
        ng_user_ids: ["id1", "id2", "id3"] });
    t.deepEqual(cf._ng_matching_texts, []);
    t.deepEqual(cf._ng_user_ids, []);
    
    cf.deleteNG({ ng_matching_texts: ["text1"], ng_user_ids: ["id1"] });
    t.deepEqual(cf._ng_matching_texts, []);
    t.deepEqual(cf._ng_user_ids, []);
});

test("delete not exist ng words, ng user ids", t => {
    const cf = t.context.delete_cf;

    cf.deleteNG({ ng_matching_texts: ["text100"], ng_user_ids: ["id100"] });
    t.deepEqual(cf._ng_matching_texts, ["text1", "text2", "text3"]);
    t.deepEqual(cf._ng_user_ids, ["id1", "id2", "id3"]);
});

test("no filtering", t => {
    const cf = t.context.cf;
    const comments = cf.getComments();
    t.deepEqual(comments, test_comments);
});

test("ng words", t => {
    const cf = t.context.cf;
    cf.addNG({ ng_matching_texts: ["comment11"], ng_user_ids: [] });
    const comments = cf.getComments();
    t.deepEqual(comments, [
        {
            no: 1, vpos: 1, post_date: 0, mail: "",
            user_id: "aa",
            text: "comment22"
        },
        {
            no: 3, vpos: 3, post_date: 0, mail: "",
            user_id: "c",
            text: "comment111"
        }
    ]);
});

test("ng user ids", t => {
    const cf = t.context.cf;
    cf.addNG({ ng_matching_texts: [], ng_user_ids: ["aa"] });
    const comments = cf.getComments();
    t.deepEqual(comments, [
        {
            no: 2, vpos: 2, post_date: 0, mail: "",
            user_id: "aab",
            text: "comment11"
        },
        {
            no: 3, vpos: 3, post_date: 0, mail: "",
            user_id: "c",
            text: "comment111"
        }
    ]);
});

test("ng words, ng user ids", t => {
    const cf = t.context.cf;
    cf.addNG({ ng_matching_texts: ["comment22"], ng_user_ids: ["c"] });
    const comments = cf.getComments();
    t.deepEqual(comments, [
        {
            no: 0, vpos: 0, post_date: 0, mail: "",
            user_id: "aa",
            text: "comment11"
        },
        {
            no: 2, vpos: 2, post_date: 0, mail: "",
            user_id: "aab",
            text: "comment11"
        }
    ]);
});

test("not exist ng words", t => {
    const cf = t.context.cf;
    cf.addNG({ ng_matching_texts: ["aaaaaa"], ng_user_ids: [] });
    const comments = cf.getComments();
    t.deepEqual(comments, test_comments);
});

test("not exist ng user ids", t => {
    const cf = t.context.cf;
    cf.addNG({ ng_matching_texts: [], ng_user_ids: ["1000"] });
    const comments = cf.getComments();
    t.deepEqual(comments, test_comments);
});