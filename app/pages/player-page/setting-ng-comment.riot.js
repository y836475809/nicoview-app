const myapi = require("../../js/my-api");
const { mountNicoGrid } = require("../../pages/common/nico-grid-mount");
const { MyObservable, window_obs } = require("../../js/my-observable");
const { NGType } = require("../../js/comment-filter");

/** @type {MyObservable} */
const player_obs = window_obs;

const nico_grid_name = "nico_grid_player_ng_commnet";

module.exports = {
    /** @type {MyObservable} */
    obs_dialog:null,

    async onMounted() {
        player_obs.on("setting-ng-comment:set-items", (
            /** @type {NGCommentItem[]}} */ args) => {
            this.setup(args);
        }); 

        // eslint-disable-next-line no-unused-vars
        const wrapFormatter = (id, value, data) => { 
            const type = data.type;
            if(type == NGType.Text){
                return "コメント";
            }
            if(type == NGType.UserId){
                return "ユーザーID";
            }
            return "";
        };
        const columns = [
            { id: "title", name: "種類", ft:wrapFormatter},
            { id: "value", name: "値" },
        ];
        const options = {
            header_height: 25,
            row_height: 25,
            img_cache_capacity:5,
            view_margin_num: 20
        };
        const state = await myapi.ipc.Config.get(nico_grid_name, null);
        this.nico_grid_obs = new MyObservable();
        mountNicoGrid("#player-comment-ng-nico-grid", state, this.nico_grid_obs, columns, options);
        
        this.nico_grid_obs.on("state-changed", async (args) => {
            const { state } = args;
            await myapi.ipc.Config.set(nico_grid_name, state);
        });
        this.nico_grid_obs.on("show-contexmenu", async () => {
            const menu_id = await myapi.ipc.popupContextMenu("player-setting-ngcomment");
            if(!menu_id){
                return;
            }
            if(menu_id=="delete"){
                this.deleteSelectedItems();
            }
        });

        player_obs.on("setting-ng-comment:set-items", async (
            /** @type {NGCommentItem[]}} */ args) => {
            await this.setup(args);
        });
    },
    async deleteSelectedItems() {
        /** @type {NGCommentItem[]} */
        const items = await this.nico_grid_obs.triggerReturn("get-selected-data-list");
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

        const ids = items.map(item => {
            return item.id;
        });
        await this.nico_grid_obs.triggerReturn("delete-items", {
            ids: ids
        });
    },
    /**
     * 
     * @param {NGCommentItem[]} ng_commnet_items 
     */
    async setup(ng_commnet_items) {
        const items = ng_commnet_items.map((item, index) => {
            const obj = Object.assign({}, item);
            obj.id = index;
            return obj;
        });
        await this.nico_grid_obs.triggerReturn("set-data", {
            key_id: "id",
            items: items
        });
    },
    onclickDelete(e) { // eslint-disable-line no-unused-vars
        this.deleteSelectedItems();
    }
};