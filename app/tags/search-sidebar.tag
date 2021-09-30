<search-sidebar>
    <style>
        .nico-search-sidebar {
            width: 100%;
            height: 100%;
            background-color: var(--control-color);
        }
        
        .nico-search-item-adjust {
            margin-right: 4px;
        }
    </style>

    <div class="nico-search-sidebar">
        <listview 
            obs={obs_listview}
            geticon={geticon}
            name={name}
            gettooltip={getTooltip}>
        </listview>
    </div>

    <script>
        /* globals my_obs */
        const myapi = window.myapi;
        const { searchItems } = window.NicoSearch;

        export default {
            obs:null,
            obs_listview:null,
            name:"nico-search",
            onBeforeMount(props) {
                this.obs = props.obs; 
                this.obs_listview = my_obs.createObs();
                
                this.geticon = (item) => {
                    const search_target = item.cond.search_target;
                    if(search_target == "keyword"){
                        return "fas fa-ellipsis-h nico-search-item-adjust";
                    }
                    if(search_target == "tag"){
                        return "fas fa-tag fa-lg";
                    }
                    return null;
                };

                const sort_map = new Map();
                const search_target_map = new Map();
                searchItems.sortItems.forEach(item => {
                    sort_map.set(`${item.name}${item.order}`, item.title);
                });
                searchItems.searchTargetItems.forEach(item => {
                    search_target_map.set(item.target, item.title);
                });
            
                this.getTooltip = (item) => {
                    const cond = item.cond;
                    const sort = sort_map.get(`${cond.sort_name}${cond.sort_order}`);
                    const target = search_target_map.get(cond.search_target);
                    return `${item.title}\n並び順: ${sort}\n種類: ${target}`;
                };

                this.obs_listview.on("changed", async (args) => {
                    const { items } = args;
                    items.forEach(item => {
                        delete item.type;
                    });
                    await myapi.ipc.Search.updateItems(items);
                });

                this.obs_listview.on("show-contextmenu", (e, args) => {
                    const { items, cb } = args; // eslint-disable-line no-unused-vars
                    cb(null);
                });

                this.obs_listview.on("item-dlbclicked", (item) => {
                    this.obs.trigger("search-page:item-dlbclicked", item.cond);
                });

                this.obs.on("search-page:sidebar:add-item", (cond) => {
                    const items = [
                        { title: cond.query, type:cond.search_target , cond: cond }
                    ];
                    this.obs_listview.trigger("addList", { items });
                });

                this.obs.on("search-page:sidebar:reload-items", async () => {
                    await this.loadItems();
                });
            },
            async onMounted() {
                await this.loadItems();
            },
            async loadItems() {
                const items = await myapi.ipc.Search.getItems();
                items.forEach(item => {
                    item.type = item.cond.search_target;
                });
                this.obs_listview.trigger("loadData", { items });
            }
        };
    </script>
</search-sidebar>