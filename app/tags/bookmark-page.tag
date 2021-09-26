<bookmark-page>
    <style scoped>
        :scope {
            --page-width: 300px;
        }

        .sidebar {
            width: var(--page-width);
            max-height: calc(100vh 
                - var(--right-sidebar-page-top) - 30px);
        }

        .content {
            width: 100%;
            background-color: var(--control-color);
        }
    </style>    

    <aside class="sidebar">
        <listview class="content"
            obs={obs_listview}
            geticon={geticon}
            name={name}
            gettitle={getTitle}>
        </listview>
    </aside>

    <script>
        /* globals my_obs */
        const myapi = window.myapi;
        const { Command } = window.Command;
        const time_format = window.TimeFormat;

        const obs = this.opts.obs; 
        this.obs_listview = my_obs.createObs();
        this.sb_button_icon = "fas fa-chevron-left";
        this.name = "bookmark";

        this.geticon = (item) => {
            return "fas fa-bookmark fa-lg";
        };

        this.getTitle = (item) => {
            const { title, data } = item;
            if(data.time>0){
                return `[${time_format.toTimeString(data.time)}] ${title}`;
            }else{
                return title;
            }
        };

        const resizeHeight = (items) => {
            const sidebar = this.root.querySelector(".sidebar");
            const content = this.root.querySelector(".content");
            const item_height = 30;
            const new_height = items.length*item_height;
            sidebar.style.height = (new_height + 35) + "px";
            content.style.height = new_height + "px";
        };

        this.on("mount", async () => {
            // TODO error対応
            const items = await myapi.ipc.Bookmark.getItems();
            this.obs_listview.trigger("loadData", { items });

            resizeHeight(items);
        });

        this.obs_listview.on("changed", async (args) => {
            const { items } = args;
            await myapi.ipc.Bookmark.updateItems(items);
            resizeHeight(items);
        });

        this.obs_listview.on("show-contextmenu", async (e, args) => {
            const { items, cb } = args;

            const menu_id = await myapi.ipc.popupContextMenu("listview-bookmark", {items});
            if(menu_id=="go-to-library"){
                const video_id = items[0].data.video_id;
                const exist = await myapi.ipc.Library.hasItem(video_id);
                if(exist){
                    obs.trigger("main-page:select-page", "library");
                    obs.trigger("library-page:scrollto", video_id);     
                } 
            }
            if(menu_id=="toggle-mark"){
                this.obs_listview.trigger("toggle-mark", { items });
            }
        });

        this.obs_listview.on("item-dlbclicked", (item) => {  
            const { video_id, time } = item.data;
            Command.play({
                id : video_id,
                time : time
            }, false);
        });
        
        obs.on("bookmark-page:add-items", items => {
            const bk_items = items.map(item => {
                return {
                    title: item.title,
                    type: "video",
                    data: {
                        video_id: item.id,
                        time: item.time
                    }
                };
            });
            this.obs_listview.trigger("addList", { items:bk_items });
        });
    </script>
</bookmark-page>