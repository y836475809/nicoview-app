<mylist-sidebar>
    <style scoped>
        .nico-mylist-sidebar {
            width: 100%;
            height: 100%;
            background-color: var(--control-color);
        }
    </style>

    <div class="nico-mylist-sidebar">
        <div class="mylist items">
            <accordion params={acdn}></accordion>
        </div>
    </div>

    <script>
        /* globals app_base_dir obs riot */
        const {remote} = require("electron");
        const {Menu} = remote;
        const JsonStore = require(`${app_base_dir}/js/json-store`);
        const { SettingStore } = require(`${app_base_dir}/js/setting-store`);

        // require(`${app_base_dir}/tags/accordion.tag`);
        if(process.env.NODE_ENTRYPOINT == "test-mylist"){
            riot.mount("accordion");
        }

        const file_path = SettingStore.getSystemFile("mylist.json");

        try {
            this.store = new JsonStore(file_path);
            this.mylist_data = this.store.load();
        } catch (error) {
            this.mylist_data = {
                is_expand: true, 
                items: []
            };
        }

        const hasItem = (id) => {
            return this.mylist_data.items.some(value=>{
                return value.id == id;
            });
        };

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
                        obs.trigger(`${sender}:delete-selected-items`);
                    }
                }
            ];
            return Menu.buildFromTemplate(nemu_templete);
        };

        this.acdn = {
            title : "mylist",
            name: "mylist-sidebar",
            expand: true,
            items: this.mylist_data.items,
            oncontextmenu: ()=> {
                const menu = createMenu("mylist-sidebar");
                menu.popup({window: remote.getCurrentWindow()});
            }
        };

        obs.on(`${this.acdn.name}-state-change`, (data) => {
            save(data);
        });
        
        obs.on(`${this.acdn.name}:add-item`, (args) => {
            const { title, id, creator, link } = args;
            obs.trigger(`${this.acdn.name}-add-items`, 
                [
                    { title, id, creator, link }
                ]
            );
            obs.trigger(`${this.acdn.name}-change-expand`, true);
        });

        obs.on(`${this.acdn.name}:has-item`, (args) => {
            const {id, cb} = args;
            cb(hasItem(id));
        });
    </script>
</mylist-sidebar>