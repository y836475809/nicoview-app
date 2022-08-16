const myapi = require("../../js/my-api");
const { GridTable } = require("../../js/gridtable");
const { window_obs } = require("../../js/my-observable");
const { NGType } = require("../../js/comment-filter");

/** @type {MyObservable} */
const player_obs = window_obs;



module.exports = {
    /** @type {MyObservable} */
    obs_dialog:null,

    /** @type {GridTable} */
    grid_table:null,
    onBeforeMount() {
        player_obs.on("setting-ng-comment:set-items", (
            /** @type {NGCommentItem[]}} */ args) => {
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
            return item.type==NGType.Text;
        }).map(item => {
            return item.value;
        });
        const ng_user_ids = items.filter(item => {
            return item.type==NGType.UserId;
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
     * @param {NGCommentItem[]} ng_commnet_items 
     */
    setup(ng_commnet_items) {
        if (this.grid_table == null) {
            const wrapFormatter = (row, cell, value, columnDef, dataContext) => { // eslint-disable-line no-unused-vars
                const type = dataContext.type;
                if(type == NGType.Text){
                    return "コメント";
                }
                if(type == NGType.UserId){
                    return "ユーザーID";
                }
                return "";
            };
            const columns = [
                { id: "title", name: "種類", formatter:wrapFormatter},
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
        const items = ng_commnet_items.map((item, index) => {
            const obj = Object.assign({}, item);
            obj.id = index;
            return obj;
        });
        this.grid_table.setData(items);

        const container = this.$(".comment-ng-grid-container");
        this.grid_table.resizeGrid(container.clientWidth, container.clientHeight); 
    },
    onclickDelete(e) { // eslint-disable-line no-unused-vars
        this.deleteSelectedItems();
    }
};