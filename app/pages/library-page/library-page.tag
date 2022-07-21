<library-page>
    <div class="split-page">
        <div class="left">
            <library-sidebar 
                search_targets={search_targets}>
            </library-sidebar>
        </div>
        <div class="gutter"></div>
        <div class="right">
            <library-content 
                search_targets={search_targets}>
            </library-content>
        </div>
    </div>
    <script>
        export default {
            search_targets:null,
            onBeforeMount() {
                this.search_targets = Object.freeze([
                    { title: "名前", id: "title" }, 
                    { title: "タグ", id: "tags" }, 
                    { title: "ID",   id: "id" }, 
                    { title: "画質", id: "is_economy" }, 
                    { title: "動画形式", id: "video_type" }
                ]);
            }
        };
    </script>
</library-page>