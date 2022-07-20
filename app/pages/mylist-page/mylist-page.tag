

<mylist-page>
    <div class="split-page">
        <div class="left">
            <mylist-sidebar obs={obs}></mylist-sidebar>
        </div>
        <div class="gutter"></div>
        <div class="right">
            <mylist-content obs={obs}></mylist-content>
        </div>
    </div>    
    <script>
        export default {
            obs:null,
            onBeforeMount(props) {
                this.obs = props.obs;
            }
        };
    </script>
</mylist-page>