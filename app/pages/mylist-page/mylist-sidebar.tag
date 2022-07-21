<mylist-sidebar>
    <style>
        .nico-mylist-sidebar {
            width: 100%;
            height: 100%;
            background-color: var(--control-color);
        }
    </style>

    <div class="nico-mylist-sidebar">
        <listview 
            obs={obs_listview}
            name={name}
            confirm={confirm}
            gettooltip={getTooltip}
            gettitle={getTitle}>
        </listview>
    </div>

    <script>
        /* globals riot */
        const myapi = window.myapi;
        const { MyObservable } = window.MyObservable;
        const main_obs = riot.obs;

        export default {
            obs_listview:null,
            name:"mylist",
            items:[],
            confirm:["delete"],
            onBeforeMount() {
                this.obs_listview = new MyObservable();

                this.getTooltip = (item) => {
                    const { title, creator } = item;
                    return `[${creator}] ${title}`;
                };

                this.getTitle = (item) => {
                    const { title, creator } = item;
                    return `[${creator}] ${title}`;
                };

                this.obs_listview.on("changed", async (args) => {
                    const { items } = args;
                    this.items = items;

                    await myapi.ipc.MyList.updateItems(items);
                });

                this.obs_listview.on("item-dlbclicked", (item) => {
                    main_obs.trigger("mylist-page:item-dlbclicked", item);
                });
                
                this.obs_listview.on("items-deleted", (args) => {
                    main_obs.trigger("mylist-page:items-deleted", args);
                });

                main_obs.on("mylist-page:sidebar:add-item", (args) => {
                    const { title, mylist_id, creator } = args;
                    const items = [
                        { title, mylist_id, creator }
                    ];
                    this.obs_listview.trigger("addList", { items });
                });

                main_obs.onReturn("mylist-page:sidebar:get-items", () => {
                    return {items:this.items};
                });

                main_obs.on("mylist-page:sidebar:select-item", (args) => {
                    const { mylist_id } = args;
                    const index = this.items.findIndex(item => {
                        return item.mylist_id == mylist_id;
                    });

                    if(index < 0){
                        this.obs_listview.trigger("clear-select");
                        return;
                    }
                    this.obs_listview.trigger("select-item-by-index", { index });
                });

                main_obs.on("mylist-page:sidebar:reload-items", async () => {
                    await this.loadItems();
                });
            },
            async onMounted() {
                await this.loadItems();
            },
            async loadItems() {
                this.items = await myapi.ipc.MyList.getItems();
                this.obs_listview.trigger("loadData", { items:this.items });
            }
        };
    </script>
</mylist-sidebar>