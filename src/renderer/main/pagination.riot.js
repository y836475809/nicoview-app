const { MyObservable } =  require("../../lib/my-observable");

module.exports = {
    state:{
        page_num:1,
        total_page_num:0,
        search_result_num:0
    },

    /** @type {MyObservable} */
    pagination_obs:null,

    /** @type {MyObservable} */
    obs_page_selector:null,
    onBeforeMount(props) {
        this.pagination_obs = props.obs;
        this.obs_page_selector = new MyObservable();

        this.pagination_obs.on("set-page-num", (args) => {
            /** @type {{page_num:number}} */
            const { page_num } = args;

            this.state.page_num = page_num;
            this.update();
        });

        this.pagination_obs.on("set-data", (args) => {
            const { page_num, total_page_num, search_result_num } = args;

            this.state.page_num = page_num;
            this.state.total_page_num = total_page_num;
            this.state.search_result_num = search_result_num;
            this.update();

            this.obs_page_selector.trigger("set-data", { page_num, total_page_num });
        });

        this.pagination_obs.on("forward", () => {
            this.onclickForward();
        });

        this.pagination_obs.on("back", () => {
            this.onclickBack();
        });

        this.obs_page_selector.on("selected-page-num", (args) => {
            /** @type {{page_num:number}} */
            const { page_num } = args;
            this.state.page_num = page_num;
            this.update();

            this.pagination_obs.trigger("move-page", { page_num: this.state.page_num });
            this.changePageSelector("remove");
        });

        this.obs_page_selector.on("close", () => {
            /** @type {HTMLElement} */
            const elm = this.$(".page-selector");
            elm.classList.remove("page-selector-show"); 

            this.changePageSelector("remove");
        });
    },
    onclickBack() {
        if(this.state.page_num > 1){
            this.state.page_num -= 1;
            this.update();

            this.pagination_obs.trigger("move-page", { page_num: this.state.page_num });
        }
    },
    onclickForward() {
        if(this.state.page_num < this.state.total_page_num){
            this.state.page_num += 1;
            this.update();

            this.pagination_obs.trigger("move-page", { page_num: this.state.page_num });
        }
    },
    /**
     * 
     * @param {string} name 
     */
    changePageSelector(name) {
        /** @type {HTMLElement} */
        const elm = this.$(".page-selector");
        elm.classList[name]("page-selector-show"); 
    },
    onclickTogglePageSelector() {
        this.changePageSelector("toggle");
    }
};
