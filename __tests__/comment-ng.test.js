const test = require("ava");
const { NGComment } = require("../app/js/comment-filter");

const mkComments = () => {
    return [
        { no: 0, vpos: 0, user_id: "aa", content: "comment11" },
        { no: 1, vpos: 1, user_id: "aa", content: "comment22" },
        { no: 2, vpos: 2, user_id: "aab",content: "comment11" },
        { no: 3, vpos: 3, user_id: "c",  content: "comment111" }
    ];
};

class TestNGComment extends NGComment{
    load(){}
    save(){}
}

test.beforeEach(t => {
    t.context.cf = new TestNGComment();

    t.context.delete_cf = new TestNGComment();
    t.context.delete_cf.addNGTexts(["text1", "text2", "text3"]);
    t.context.delete_cf.addNGUserIDs(["id1", "id2", "id3"]);
});

test("add ng words, ng user ids", t => {
    const cf = t.context.cf;

    t.deepEqual(cf._ng_texts, []);
    t.deepEqual(cf._ng_user_ids, []);

    cf.addNGTexts(["a"]);
    cf.addNGUserIDs([]);
    t.deepEqual(cf._ng_texts, ["a"]);
    t.deepEqual(cf._ng_user_ids, []);

    cf.addNGTexts(["a"]);
    cf.addNGUserIDs([]);
    t.deepEqual(cf._ng_texts, ["a"]);
    t.deepEqual(cf._ng_user_ids, []);

    cf.addNGTexts([]);
    cf.addNGUserIDs(["b"]);
    t.deepEqual(cf._ng_texts, ["a"]);
    t.deepEqual(cf._ng_user_ids, ["b"]);
    
    cf.addNGTexts([]);
    cf.addNGUserIDs(["b"]);
    t.deepEqual(cf._ng_texts, ["a"]);
    t.deepEqual(cf._ng_user_ids, ["b"]);

    cf.addNGTexts(["a", "b"]);
    cf.addNGUserIDs(["a", "b"]);
    t.deepEqual(cf._ng_texts, ["a", "b"]);
    t.deepEqual(cf._ng_user_ids, ["b", "a"]);
});

test("delete ng words, ng user ids", t => {
    const cf = t.context.delete_cf;

    cf.deleteNGTexts(["text1"]);
    cf.deleteNGUserIDs([]);
    t.deepEqual(cf._ng_texts, ["text2", "text3"]);
    t.deepEqual(cf._ng_user_ids, ["id1", "id2", "id3"]);

    cf.deleteNGTexts(["text3"]);
    cf.deleteNGUserIDs([]);
    t.deepEqual(cf._ng_texts, ["text2"]);
    t.deepEqual(cf._ng_user_ids, ["id1", "id2", "id3"]);

    cf.deleteNGTexts([]);
    cf.deleteNGUserIDs(["id1"]);
    t.deepEqual(cf._ng_texts, ["text2"]);
    t.deepEqual(cf._ng_user_ids, ["id2", "id3"]);

    cf.deleteNGTexts([]);
    cf.deleteNGUserIDs(["id3"]);
    t.deepEqual(cf._ng_texts, ["text2"]);
    t.deepEqual(cf._ng_user_ids, ["id2"]);   
});

test("delete some ng words, ng user ids", t => {
    const cf = t.context.delete_cf;

    cf.deleteNGTexts(["text1", "text3"]);
    cf.deleteNGUserIDs(["id1", "id3"]);
    t.deepEqual(cf._ng_texts, ["text2"]);
    t.deepEqual(cf._ng_user_ids, ["id2"]);
});

test("delete empty ng words, ng user ids", t => {
    const cf = t.context.delete_cf;

    cf.deleteNGTexts(["text1", "text2", "text3"]);
    cf.deleteNGUserIDs(["id1", "id2", "id3"]);
    t.deepEqual(cf._ng_texts, []);
    t.deepEqual(cf._ng_user_ids, []);
    
    cf.deleteNGTexts(["text1"]);
    cf.deleteNGUserIDs(["id1"]);
    t.deepEqual(cf._ng_texts, []);
    t.deepEqual(cf._ng_user_ids, []);
});

test("delete not exist ng words, ng user ids", t => {
    const cf = t.context.delete_cf;

    cf.deleteNGTexts(["text100"]);
    cf.deleteNGUserIDs(["id100"]);
    t.deepEqual(cf._ng_texts, ["text1", "text2", "text3"]);
    t.deepEqual(cf._ng_user_ids, ["id1", "id2", "id3"]);
});

test("no filtering", t => {
    const cf = t.context.cf;

    const exp_comments = mkComments();
    const comments = cf.getComments(mkComments());
    t.deepEqual(comments, exp_comments);
});

test("ng words", t => {
    const cf = t.context.cf;

    cf.addNGTexts(["comment11"]);
    cf.addNGUserIDs([]);
    const comments = cf.getComments(mkComments());
    t.deepEqual(comments, [
        { no: 1, vpos: 1, user_id: "aa", content: "comment22" },
        { no: 3, vpos: 3, user_id: "c", content: "comment111" }
    ]);
});

test("ng user ids", t => {
    const cf = t.context.cf;

    cf.addNGTexts([]);
    cf.addNGUserIDs(["aa"]);
    const comments = cf.getComments(mkComments());
    t.deepEqual(comments, [
        { no: 2, vpos: 2, user_id: "aab", content: "comment11" },
        { no: 3, vpos: 3, user_id: "c", content: "comment111" }
    ]);
});

test("ng words, ng user ids", t => {
    const cf = t.context.cf;

    cf.addNGTexts(["comment22"]);
    cf.addNGUserIDs(["c"]);
    const comments = cf.getComments(mkComments());
    t.deepEqual(comments, [
        { no: 0, vpos: 0, user_id: "aa", content: "comment11" },
        { no: 2, vpos: 2, user_id: "aab", content: "comment11" }
    ]);
});

test("not exist ng words", t => {
    const cf = t.context.cf;

    const exp_comments = mkComments();
    cf.addNGTexts(["aaaaaa"]);
    cf.addNGUserIDs([]);
    const comments = cf.getComments(mkComments());
    t.deepEqual(comments, exp_comments);
});

test("not exist ng user ids", t => {
    const cf = t.context.cf;

    const exp_comments = mkComments();
    cf.addNGTexts([]);
    cf.addNGUserIDs(["1000"]);
    const comments = cf.getComments(mkComments());
    t.deepEqual(comments, exp_comments);
});