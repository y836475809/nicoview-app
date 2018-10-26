<player-tags>
    <style scoped>
         :scope {
            width: calc(100% - 4px);
            height: 50px;
            border: 2px solid black;
            display:block;
            overflow: auto;
        }
        .tag-button {
            /* padding: 10px 30px; */
            margin: 5px 5px;
            color: white;
            background-color: royalblue;
            border-style: none;
            outline:none;
            cursor: pointer;
        }
    </style>

    <button type="button" class="tag-button" 
        each={item, i in video_tags} data-index={i} onclick={onclickTag}>
        {item}
    </button>

    <script>
        /* globals obs */
        this.video_tags = [];
        this.onclickTag = (e) => {
            const index = e.target.getAttribute("data-index");
            console.log("index=", index, " value=", this.video_tags[index]);
        };

        obs.on("on_load_player_tags", (tag_data) => {
            this.video_tags = tag_data.video_tags;
            this.update();
        });
    </script>
</player-tags>