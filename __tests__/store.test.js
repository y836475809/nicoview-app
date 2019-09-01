const test = require("ava");
const { MyStore, store_mng } = require("../app/js/riotx-stores");

const test_store = new MyStore({
    name: "app",
    state:{
        id:null,
        items:[],
    },
    actions: {
        addItem: async (context, video_id, item) => {
            context.commit("addItem", video_id, item);
        },
    },
    mutations: {
        addItem : (context, video_id, item) => {
            context.state.id = video_id;
            context.state.items.push(item);
            return [["itemChanged", video_id, item]];
        }
    }
});

test.cb("store", (t) => {
    test_store.change("itemChanged", (video_id, item) => {
        t.is(video_id, "sm10");
        t.deepEqual(item, {id:"sm10", name:"test10"});
        t.end();
    });
    test_store.action("addItem", "sm10", {id:"sm10", name:"test10"});
});