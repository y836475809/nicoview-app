<bookmark-page>
    <style scoped>
        :scope {
            position: absolute;
            top: 0px;
            width: 100%;
            height: 100%;
            background-color: var(--control-color);
        }
        .bookmark-sidebar {
            width: 100%;
            height: 100%;
            background-color: var(--control-color);
        }
    </style>    

    <!-- <div class="bookmark-sidebar"> -->
        <accordion 
            title="ブックマーク" 
            items={bookmark_data.items}
            expand={true} 
            obs={obs_bookmark}>
        </accordion>
    <!-- </div> -->
    
    <script>
        /* globals app_base_dir riot */
        const {remote} = require("electron");
        const {Menu} = remote;
        const JsonStore = require(`${app_base_dir}/js/json-store`);
        const { SettingStore } = require(`${app_base_dir}/js/setting-store`);

        const self = this;

        const obs = this.opts.obs; 
        this.obs_bookmark = riot.observable();
        const getBookmarkIcon = () => {
            return {
                name: "fas fa-bookmark fa-lg",
                class_name: "bookmark-item"
            };
        };

        const bookmark_file_path = SettingStore.getSettingFilePath("bookmark.json");
        try {
            this.bookmark_store = new JsonStore(bookmark_file_path);
            this.bookmark_data = this.bookmark_store.load();
            this.bookmark_data.items.forEach(value => {
                value.icon = getBookmarkIcon();
            });
        } catch (error) {
            this.bookmark_data = {
                is_expand: false, 
                // items: []
                items: [{
                    title: "test1", 
                },
                {
                    title: "page1", 
                }]
            };
        }

        const context_menu = Menu.buildFromTemplate([
            { 
                label: "削除", click() {
                    self.obs_search.trigger("delete-selected-items");
                }
            }
        ]);
        
        this.obs_bookmark.on("show-contextmenu", (e) => {
            context_menu.popup({window: remote.getCurrentWindow()}); 
        });

        obs.on("bookmark-page:sidebar:add-item", (item) => {
            this.obs_bookmark.trigger("add-items", [
                { 
                    title: item.title, 
                    video_id: item.video_id,
                    icon: getBookmarkIcon()
                }
            ]);
        });
    </script>
</bookmark-page>