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
            const { cmd_id, item } = args;
            console.log("cmd_id=", cmd_id, ", item=", item);
        });

        const mk_data = (size) => {
            const data_list = [];
            for(let i=0; i<size; i++){
                let data = [];
                columns.forEach(col => {
                    data.push({
                        id: col.id,
                        data: `i=${i}, name=${col.name}`
                    });
                });
                data_list.push(data);
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