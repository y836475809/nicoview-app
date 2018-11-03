<test-player-viewinfo>
    <style scoped>
        .test-button{
            height: 25px;
        }
        .test-player-viewinfo-page{
            height: calc(100% - 25px);
        }
    </style>

    <div class="test-button">
        <button type="button" onclick={onclickLoad}>load</button>
        <button type="button" onclick={onclickScale1}>x1</button>
        <button type="button" onclick={onclickScale15}>x1.5</button>
        <button type="button" onclick={onclickLoad2}>load comment</button>
        <button type="button" onclick={onclickLoad3}>scroll</button>
    </div>
    <player-viewinfo-page ref="pv_page" class="test-player-viewinfo-page"></player-viewinfo-page>
    
    <script>
        /* globals base_dir obs */
        const fs = require("fs");
        const reader = require("../app/js/reader");
        require("datatables.net-scroller")( window, window.$ ); 

        require(`${base_dir}/app/tags/player-viewinfo-page`);

        this.onclickLoad = () => {
            const comment_path = `${base_dir}/test/data/test1-comment.xml`;
            const xml = fs.readFileSync(comment_path, "utf-8");
            const commnets = reader.comment(xml);
            const data = {
                src: `${base_dir}/test/data/test1.mp4`,
                type: "video/mp4",
                commnets: commnets
            };

            obs.trigger("on_set_player_state", "play"); 
            obs.trigger("receivedData", data); 
        };
        this.onclickLoad2 = () => {
            let commnets = [];
            const nn = 100;
            for (let index = 0; index < nn; index++) {
                commnets.push({
                    no: index + 1,
                    vpos: 10 + index,
                    date: 1332592373506 + index*100,
                    user_id: "AAA",
                    mail: "ue",
                    text: "------------------text1------------------------"
                });
            }
            obs.trigger("on_change_viweinfo",{
                thumb_info: {
                    video_id: "sm100000",
                    title: "test sm100000",
                    description: "動画",
                    thumbnail_url: `${base_dir}/test/data/sample.jpeg`, //130x100
                    first_retrieve: "2017-07-07T18:30:00+09:00",
                    length: "10:00",
                    movie_type: "mp4",
                    size_high: 1000000,
                    size_low: 2000000,
                    view_counter: 1000,
                    comment_num: 2000,
                    mylist_counter: 100,
                    last_res_body: "test",
                    watch_url: "http://www.nicovideo.jp/watch/sm100000",
                    thumb_type: "video",
                    embeddable: 1,
                    no_live_play: 0,
                    tags: [            
                        { text: "タグ1", lock: true },
                        { text: "タグ2", lock: true }
                    ],
                    user_id: "1234567",
                    user_nickname: "abcdefg",
                    user_icon_url: `${base_dir}/test/data/user_icon.jpg` //50x50
                },
                commnets: commnets
            }); 
        };
        this.onclickLoad3 = () => {
            obs.trigger("on_scroll", 50);
        };
        // let self = this;
        this.onclickScale1 = () => {
            this.refs.pv_page.setkk(1);
        }; 
        this.onclickScale15 = () => {
            this.refs.pv_page.setkk(1.5);
        };           
    </script>
</test-player-viewinfo>