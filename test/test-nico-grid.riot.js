const { MyObservable } = require("../app/js/my-observable");
const { buttonFormatter } = require("./nico-grid-formatter");

module.exports = {
    obs: null,
    onBeforeMount() {
        this.row_height = 60;
        this.obs = new MyObservable();
    },
    async onMounted() {  

        const ft = (cell_data) => {
            return `<a href="">${cell_data.data}</a>`;
        };
        const cmd_opt = ["play", "stack", "bookmark", "download"];
        const columns = [
            {id: "thumb_img", name: "サムネイル", ft:ft},
            {id: "title", name: "名前", ft:ft},
            {id: "command", name: "操作", ft:buttonFormatter.bind(this, cmd_opt)},
            {id: "info", name: "情報", ft:ft},
            {id: "pub_date", name: "投稿日", ft:ft},
            {id: "play_time", name: "時間", ft:ft},
            {id: "tags", name: "タグ, コメント", ft:ft},
        ];
        await this.obs.triggerReturn("set-columns", {
            items:columns
        });

        const cell_widths = {};
        for(let i=0; i<columns.length; i++){
            cell_widths[columns[i].id] = 150;
        }
        await this.obs.triggerReturn("set-option", {
            option:{
                column_width: cell_widths,
                row_height:60
            }
        });
        this.obs.on("cmd",(args) => {
            const { cmd_id, data } = args;
            console.log("cmd_id=", cmd_id, ", data=", data);
        });

        const mk_data = (size) => {
            const src_db = {
                tags: "タグ, コメント",
                video_id: "sm",
                thumb_img: "サムネイル",
                title: "名前",
                command: "操作",
                info: "情報",
                pub_date: "投稿日",
                play_time: "時間",  
            };
            const data_list = [];
            for(let i=0; i<size; i++){  
                const clone_data = {};
                Object.assign(clone_data, src_db);
                columns.forEach(col => {
                    const val = clone_data[col.id];
                    clone_data[col.id] = `${val}${i}`;
                });
                clone_data["video_id"] = `${clone_data["video_id"]}${i}`;
                data_list.push(clone_data);
            }
            return data_list;
        };

        const btn1 = document.getElementById("gt-btn1");
        btn1.onclick = async () => {
            const data_list = mk_data(50);
            await this.obs.triggerReturn("set-data", {
                items:data_list
            });
        };
        const btn2 = document.getElementById("gt-btn2");
        btn2.onclick = async () => {
            const data_list = mk_data(10000);
            await this.obs.triggerReturn("set-data", {
                items:data_list
            });
        };
    }
};