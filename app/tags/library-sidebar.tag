<library-sidebar>
    <style scoped>
        .library-sidebar {
            width: 100%;
            height: 100%;
            background-color: var(--control-color);
        }
    </style>

    <div class="library-sidebar">
        <div class="search items">
            <accordion params={acdn_search}></accordion>
        </div>
    </div>

    <script>
        /* globals app_base_dir obs */
        const {remote} = require("electron");
        const {Menu} = remote;
        const JsonStore = require(`${app_base_dir}/js/json-store`);
        const { SettingStore } = require(`${app_base_dir}/js/setting-store`);

        require(`${app_base_dir}/tags/accordion.tag`);

        const seach_file_path = SettingStore.getSystemFile("search.json");

        try {
            this.store = new JsonStore(seach_file_path);
            this.search_data = this.store.load();
        } catch (error) {
            this.search_data = {
                is_expand: false, 
                items: []
            };
        }

        const save = (data) => {
            try {
                this.store.save(data);
            } catch (error) {
                console.log(error);
            }
        };

        const createMenu = (sender) => {
            const nemu_templete = [
                { 
                    label: "delete", click() {
                        obs.trigger(`${sender}-delete-selected-items`);
                    }
                }
            ];
            return Menu.buildFromTemplate(nemu_templete);
        };

        this.acdn_search = {
            title : "検索",
            name: "search",
            expand: true,
            items: this.search_data.items,
            oncontextmenu: ()=> {
                const menu = createMenu("search");
                menu.popup({window: remote.getCurrentWindow()});
            }
        };

        obs.on(`${this.acdn_search.name}-dlbclick-item`, (item) => {
            obs.trigger("on_change_search_item", item.query);
        });

        obs.on(`${this.acdn_search.name}-state-change`, (data) => {
            save(data);
        });
        
        obs.on("on_add_search_item", (query) => {
            obs.trigger(`${this.acdn_search.name}-add-items`, 
                [
                    { title: query, query: query }
                ]
            );
            obs.trigger(`${this.acdn_search.name}-change-expand`, true);
        });
    </script>
</library-sidebar>