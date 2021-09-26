<search-page>
    <div class="split-page">
        <div class="left">
            <search-sidebar obs={obs}></search-sidebar>
        </div>
        <div class="gutter"></div>
        <div class="right">
            <search-content obs={obs}></search-content>
        </div>
    </div>
    <script>
        export default {
            onBeforeMount(props) {
                this.obs = props.obs;
            }
        };
    </script>
</search-page>