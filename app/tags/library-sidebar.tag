<library-sidebar>
    <style>
        .library-sidebar {
            width: 100%;
            height: 100%;
            background-color: var(--control-color);
        }
    </style>

    <div class="library-sidebar">
        <listview 
            obs={obs_listview}
            name={name}
            geticon={geticon}
            gettooltip={gettooltip}>
        </listview>
    </div>

    <script>
        /* globals my_obs */
        export default {
            onBeforeMount(props) {
                this.myapi = window.myapi;

                this.obs = props.obs; 
                this.obs_listview = my_obs.createObs();
                this.name = "library-search";

                const target_map = new Map();
                this.props.search_targets.forEach(target=>{
                    target_map.set(target.id, target.title);
                });

                this.gettooltip = (item) => {
                    const target_ids = item.target_ids;
                    if(!target_ids){
                        return item.title;
                    }
                    const target_titles = target_ids.map(target_id=>{
                        if(target_map.has(target_id)){
                            return target_map.get(target_id);
                        }else{
                            return `${target_id}に対応する項目がない`;
                        }
                    });
                    return `${item.title}\n検索対象:${target_titles.join(", ")}`;
                };
                this.geticon = (item) => {
                    const target_ids = item.target_ids;
                    if(target_ids){
                        return "fas fa-filter";
                    }
                    return null;
                };

                this.obs_listview.on("changed", async (args) => {
                    const { items } = args;
                    await this.myapi.ipc.Library.updateSearchItems(items);
                });
                
                this.obs_listview.on("show-contextmenu", (e, args) => {
                    const { items, cb } = args;
                    cb(null);
                });

                this.obs.on("library-page:sidebar:add-search-item", (args) => {
                    const { item } = args;
                    this.obs_listview.trigger("addList", { items:[item] });
                });

                this.obs_listview.on("item-dlbclicked", (item) => {
                    this.obs.trigger("library-page:search-item-dlbclicked", item);
                });
            },
            async onMounted() {
                const items = await this.myapi.ipc.Library.getSearchItems();
                this.obs_listview.trigger("loadData", { items });
            }
        };
    </script>
</library-sidebar>