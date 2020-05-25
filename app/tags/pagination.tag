<pagination>
    <style scoped>
        :scope {
            display: flex;
        }

        .label {
            user-select: none;
            margin-left: 5px;
        }

        .label.page {
            width: 60px;
            cursor: pointer;
            border: 1px solid gray;
            border-radius: 3px;
            padding: 5px;
        }

        .page-container {
            position: relative;
            display: flex;
        }
        .page-selector {
            display: none;
            position: absolute;
            top: 30px;
            left: 0px;
            z-index: 999;
        }
        .page-selector-show {
            display: block;
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
    <div class="page-container center-hv" >
        <div class="label page center-hv" title="ページ選択" onclick={onclickTogglePageSelector}>
            {current_page} / {total_pages}
        </div>
        <search-page-selector class="page-selector" obs={obs_page_selector}> 
        </search-page-selector>
    </div>
    <div class="navi center-hv" onclick={onclickForward}><i class="fas fa-chevron-right"></i></div>
    <div class="label center-hv">ヒット件数: {total_count.toLocaleString()}</div>

    <script>
        /* globals riot */
        const pagination_obs = this.opts.obs;
        this.obs_page_selector = riot.observable();

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

            this.obs_page_selector.trigger("set-page-num", total_page_num);
        });

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

        const changePageSelector = (name) => {
            const elm = this.root.querySelector(".page-selector");
            elm.classList[name]("page-selector-show"); 
        };

        this.onclickTogglePageSelector = () => {
            changePageSelector("toggle");
        };

        this.obs_page_selector.on("selected", (num) => {
            this.current_page = num;
            this.update();

            pagination_obs.trigger("move-page", { page_num: this.current_page });
            changePageSelector("remove");
        });

        this.obs_page_selector.on("close", () => {
            const elm = this.root.querySelector(".page-selector");
            elm.classList.remove("page-selector-show"); 

            changePageSelector("remove");
        });
    </script>
</pagination>