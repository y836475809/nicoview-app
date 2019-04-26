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
            //TODO
            /* globals app_base_dir obs */
            const {remote} = require("electron");
            const {Menu} = remote;
            const JsonStore = require(`${app_base_dir}/js/json-strore`);
            const { SettingStore } = require(`${app_base_dir}/js/setting-store`);
    
            require(`${app_base_dir}/tags/accordion.tag`);
    
            const seach_file_path = SettingStore.getSystemFile("nico-search.json");
    
            try {
                this.store = new JsonStore(seach_file_path);
                this.nico_search_data = this.store.load();
            } catch (error) {
                this.nico_search_data = {
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
                items: this.items,
                oncontextmenu: ()=> {
                    const menu = createMenu("mylist-sidebar");
                    menu.popup({window: remote.getCurrentWindow()});
                }
            };
    
            obs.on(`${this.acdn.name}:dlbclick-item`, (item) => {
                obs.trigger("on_change_nico_search_cond", item.cond);
            });
    
            obs.on(`${this.acdn.name}:state-change`, (data) => {
                save(data);
            });
            
            obs.on(`${this.acdn.name}:add-item`, (args) => {
                const { cond, icon } = args;
                obs.trigger(`${this.acdn.name}-add-items`, 
                    [
                        { title: cond.query, cond: cond, icon: icon }
                    ]
                );
            });
        </script>
    </mylist-sidebar>