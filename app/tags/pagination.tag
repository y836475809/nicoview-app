<pagination>
    <style scoped>
        :scope {
            display: flex;
        }

        .label {
            user-select: none;
            margin-left: 5px;
        }

        .page-input-container {
            display: flex;
        }
        .page-input-container input {
            width: 50px;
            height: 25px;
            text-align: right;
            outline: 0;
        }

        i[class^="fas fa-chevron"] {
            font-size: 20px;
        }

        .navi {
            width: 30px;
            height: 30px;
            cursor: pointer;
        }
        .navi > i {
            color: gray;
        }
        .navi > i:hover {
            color: black;
        }
    </style>

    <div class="navi center-hv" onclick={onclickBack}><i class="fas fa-chevron-left"></i></div>
    <div class="page-input-container center-hv">
        <input type="tel" value={current_page} onkeypress={onkeypress}/>
        <div class="label center-hv"> / {total_pages}</div>
    </div>
    <div class="navi center-hv" onclick={onclickForward}><i class="fas fa-chevron-right"></i></div>
    <div class="label center-hv">ヒット件数: {total_count.toLocaleString()}</div>

    <script>
        const pagination_obs = this.opts.obs;

        this.current_page = 1;
        this.total_pages = 0;
        this.total_count = 0;

        pagination_obs.on("set-page-num", (args) => {
            const { page_num } = args;

            this.current_page = page_num;
            this.update();
        });

        pagination_obs.on("set-data", (args) => {
            const { page_num, total_page_num, total_count } = args;

            this.current_page = page_num;
            this.total_pages = total_page_num;
            this.total_count = total_count;
            this.update();
        });

        this.onkeypress = (e) =>{
            if(e.key=="Enter"){
                const num = parseInt(e.target.value);
                if(isNaN(num)){
                    return;
                }
                this.current_page = num;

                pagination_obs.trigger("move-page", { page_num: this.current_page });
                return;
            }
            if(!/^[0-9]+$/.test(e.key)){
                e.returnValue = false;
            }
        };

        this.onclickBack = () =>{
            if(this.current_page > 1){
                this.current_page -= 1;
                this.update();

                pagination_obs.trigger("move-page", { page_num: this.current_page });
            }
        };

        this.onclickForward = () =>{
            if(this.current_page < this.total_pages){
                this.current_page += 1;
                this.update();

                pagination_obs.trigger("move-page", { page_num: this.current_page });
            }
        };

    </script>
</pagination>