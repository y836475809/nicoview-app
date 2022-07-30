<sidebar-page>
    <style>
        .split-page {
            width: 100%;
            height: 100%;
            --left-width: 300px;
            display: flex;
        }
        .split-page > .gutter {    
            width: 4px;
            border-left: 1px solid var(--control-border-color);
            background-color: var(--control-color);
        } 
        .split-page > .left{
            background-color: var(--control-color);
            width: var(--left-width);
            overflow: auto;
        }
        .split-page > .left > * > div {
            width: calc(100%  - 5px);
            height: 100%;
        }
        .split-page > .right{
            background-color: var(--control-color);
            width: calc(100%);
            height: 100%;
            overflow-y: hidden;
        }
    </style>
    <div class="split-page">
        <div class="left {listview_name}">
            <library-sidebar if={is_library} search_targets={search_targets}>
            </library-sidebar>
            <search-sidebar if={is_search}></search-sidebar>
            <mylist-sidebar if={is_mylist}></mylist-sidebar>
        </div>
        <div class="gutter"></div>
        <div class="right">
            <library-content if={is_library} search_targets={search_targets}></library-content>
            <search-content if={is_search}></search-content>
            <mylist-content if={is_mylist}></mylist-content>
        </div>
    </div>
    <script>
        export default {
            onBeforeMount(prop) {
                this.listview_name = `listview-${prop.page_name}`;
                
                /** @type {string} */
                const page_name = prop.page_name;
                this.is_library = page_name=="library";
                this.is_search = page_name=="search";
                this.is_mylist = page_name=="mylist";

                if(this.is_library){
                    this.search_targets = Object.freeze([
                        { title: "名前", id: "title" }, 
                        { title: "タグ", id: "tags" }, 
                        { title: "ID",   id: "id" }, 
                        { title: "画質", id: "is_economy" }, 
                        { title: "動画形式", id: "video_type" }
                    ]);  
                }
            }
        };
    </script>
</sidebar-page>