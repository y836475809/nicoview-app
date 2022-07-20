<player-tags>
    <style>
         :host {
            width: 100%;
            height: 100%;
            padding: 2px;
            display:block;
            overflow: auto;
        }
        .tag-button {
            margin: 2px 2px;
            color: blue;
            background-color: transparent;
            border-style: none;
            outline:none;
            cursor: pointer;
        }
        .tag-lock {
            display: inline;
            color: red;
            margin-left: 5px;
        }
    </style>
    
    <button type="button" class="tag-button" 
        each={(item, i) in state.video_tags} onclick={onclickTag.bind(this,item)}>
        {item.name}<div class="tag-lock" if={item.isLocked}>[lock]</div>
    </button>

    <script>
        const myapi = window.myapi;

        export default {
            state:{
                video_tags:[]
            },
            obs:null,
            onBeforeMount(props) {
                this.obs = props.obs; 
                
                this.onclickTag = (item, e) => { // eslint-disable-line no-unused-vars
                    const tag = item.name;
                    myapi.ipc.Search.searchTag({
                        query: tag,
                        search_target:"tag"
                    });
                };

                this.obs.on("player-tag:set-tags", (video_tags) => {
                    this.state.video_tags = video_tags;
                    this.update();
                });
            }
        };
    </script>
</player-tags>