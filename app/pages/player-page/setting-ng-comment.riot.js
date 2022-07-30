/* globals riot */
const myapi = require("../../js/my-api");
const { GridTable } = require("../../js/gridtable");

/** @type {MyObservable} */
const player_obs = riot.obs;



module.exports = {
    /** @type {MyObservable} */
    obs_dialog:null,

    /** @type {GridTable} */
    grid_table:null,
    onBeforeMount() {
        player_obs.on("setting-ng-comment:ng-items", (
            /** @type {NGItems}} */ args) => {
            this.setup(args);
        });
    },
    deleteSelectedItems() {
        /** @type {NGCommentItem[]} */
        const items = this.grid_table.getSelectedDatas();
        if(items.length===0){
            return;
        }

        const ng_texts = items.filter(item => {
            return item.type=="text";
        }).map(item => {
            return item.value;
        });
        const ng_user_ids = items.filter(item => {
            return item.type=="user_id";
        }).map(item => {
            return item.value;
        });

        player_obs.trigger("player-main-page:delete-ng-comment", { 
            ng_texts, ng_user_ids 
        });

        this.grid_table.deleteItems(items);
    },
    /**
     * 
     * @param {NGItems} ng_items 
     */
    setup(ng_items) {
        if (this.grid_table == null) {
            const columns = [
                { id: "title", name: "種類" },
                { id: "value", name: "値" },
            ];
            const options = {
                rowHeight: 25,
            };
            this.grid_table = new GridTable("comment-ng-grid", columns, options);
            this.grid_table.init(".comment-ng-grid");
            this.grid_table.setupResizer(".comment-ng-grid-container");
            this.grid_table.onContextMenu(async (e) => { // eslint-disable-line no-unused-vars
                const menu_id = await myapi.ipc.popupContextMenu("player-setting-ngcomment");
                if(!menu_id){
                    return;
                }
                if(menu_id=="delete"){
                    this.deleteSelectedItems();
                }
            });
        }
        
        const { ng_texts, ng_user_ids } = ng_items;
        const items1 = ng_texts.map((text, index) => {
            return {
                id: index,
                title: "コメント",
                type: "text",
                value: text
            };
        });

        const base_index = ng_texts.length;
        const items2 = ng_user_ids.map((user_id, index) => {
            return {
                id: index + base_index,
                title: "ユーザーID",
                type: "user_id",
                value: user_id
            };
        });
        const items = items1.concat(items2);
        this.grid_table.setData(items);

        const container = this.$(".comment-ng-grid-container");
        this.grid_table.resizeGrid(container.clientWidth, container.clientHeight); 
    },
    onclickDelete(e) { // eslint-disable-line no-unused-vars
        this.deleteSelectedItems();
    }
};