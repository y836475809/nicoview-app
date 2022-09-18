const { MyObservable } = require("../app/js/my-observable");


module.exports = {
    obs_gt: null,
    onBeforeMount() {
        this.row_height = 60;
        this.obs = new MyObservable();
    },
    async onMounted() {  
        const header = [];
        const cell_widths = {};
        for(let i=0; i<10; i++){
            header.push({
                id: i,
                name: `header${i}`
            });
            cell_widths[i] = 150;
        }
        await this.obs.triggerReturn("set-option", {
            option:{
                cell_widths
            }
        });
        await this.obs.triggerReturn("set-header", {
            items:header
        });

        const mk_data = (size) => {
            const data_list = [];
            for(let i=0; i<size; i++){
                let data = [];
                for(let j=0; j<10; j++){
                    data.push({
                        id: i,
                        data: `i=${i}, data${j+1}`
                    });
                }
                data_list.push(data);
            }
            return data_list
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