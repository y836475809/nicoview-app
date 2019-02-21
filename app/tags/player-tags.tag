<player-tags>
    <style scoped>
         :scope {
            --border-width: 1px;
            --margin-value: 2px;
            --total-margin: calc((var(--border-width) * 2 + var(--margin-value)));
            width: calc(100% - var(--total-margin));
            height: calc(100% - var(--total-margin));
            border: var(--border-width) solid var(--control-border-color);
            margin: var(--margin-value);
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
        each={item, i in video_tags} data-index={i} onclick={onclickTag}>
        {item.text}<div class="tag-lock" if={item.lock} data-index={i}>[lock]</div>
    </button>

    <script>
        /* globals obs */
        this.video_tags = [];
        this.onclickTag = (e) => {
            const index = e.target.getAttribute("data-index");
            console.log("index=", index, " value=", this.video_tags[index]);
        };

        obs.on("on_load_player_tags", (video_tags) => {
            this.video_tags = video_tags;
            this.update();
        });
    </script>
</player-tags>