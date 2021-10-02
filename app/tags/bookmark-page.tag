<bookmark-page>
    <style>
        :host {
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

        const resizeHeight = (tag, items) => {
            const sidebar = tag.$(".sidebar");
            const content = tag.$(".content");
            const item_height = 30;
            const new_height = items.length*item_height;
            sidebar.style.height = (new_height + 35) + "px";
            content.style.height = new_height + "px";
        };

        export default {
            obs:null,
            obs_listview:null,
            sb_button_icon:"fas fa-chevron-left",
            name: "bookmark",
            onBeforeMount(props) {
                this.obs = props.obs; 
                this.obs_listview = my_obs.createObs();

                this.geticon = (item) => {  // eslint-disable-line no-unused-vars
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

                this.obs_listview.on("changed", async (args) => {
                    const { items } = args;
                    await myapi.ipc.Bookmark.updateItems(items);
                    resizeHeight(this, items);
                });

                this.obs_listview.on("show-contextmenu", async (e, args) => {
                    const { items, cb } = args; // eslint-disable-line no-unused-vars

                    const menu_id = await myapi.ipc.popupContextMenu("listview-bookmark", {items});
                    if(menu_id=="go-to-library"){
                        const video_id = items[0].data.video_id;
                        const exist = await myapi.ipc.Library.hasItem(video_id);
                        if(exist){
                            this.obs.trigger("main-page:select-page", "library");
                            this.obs.trigger("library-page:scrollto", video_id);     
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
                
                this.obs.on("bookmark-page:add-items", items => {
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
            },
            async onMounted() {
                // TODO error対応
                const items = await myapi.ipc.Bookmark.getItems();
                this.obs_listview.trigger("loadData", { items });

                resizeHeight(this, items);
            }
        }; 
    </script>
</bookmark-page>