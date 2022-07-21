<sidebar-page>
    <div class="split-page">
        <div class="left">
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