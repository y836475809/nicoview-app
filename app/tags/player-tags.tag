<player-tags>
    <style scoped>
         :scope {
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
        each={item, i in video_tags} onclick={onclickTag.bind(this,item)}>
        {item.name}<div class="tag-lock" if={item.isLocked}>[lock]</div>
    </button>

    <script>
        const obs = this.opts.obs; 
        
        this.video_tags = [];
        
        this.onclickTag = (item, e) => {
            const tag = item.name;
            obs.trigger("player-main-page:search-tag", {
                query: tag,
                search_target:"tag"
            });
        };

        obs.on("player-tag:set-tags", (video_tags) => {
            this.video_tags = video_tags;
            this.update();
        });
    </script>
</player-tags>