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

        const mmm = [];
        for(let i=0; i<50; i++){
            let data = [];
            for(let j=0; j<10; j++){
                data.push({
                    id: i,
                    data: `i=${i}, data${j+1}`
                });
            }
            mmm.push(data);
        }
        
        const btn1 = document.getElementById("test-modal1");
        btn1.onclick = async () => {
            await this.obs.triggerReturn("set-data", {
                items:mmm
            });
        };
    }
};