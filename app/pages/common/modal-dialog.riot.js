
module.exports = {
    state: {
        message:"",
        showok:false,
        showcancel:false,
        btn_ok:"button",
        btn_cancel:"button"
    },

    /** @type {MyObservable} */
    obs_dialog: null,

    /** @type {boolean} */
    on_cancel: null,

    /** @type {function(string):void>} */
    cb:null,
    onBeforeMount(props) {
        this.state.message = "";
        this.obs_dialog = props.obs;
        this.on_cancel = props.oncancel;
    },
    onMounted() {
        this.obs_dialog.on("show", (args) => {
            this.root.dataset.open = true;

            const { message, buttons, cb } = args;
            this.state.message = message;

            if(buttons===undefined){
                this.state.btn_ok = "button non";
                this.state.btn_cancel = "button non";
            }else{
                const show_ok = buttons.includes("ok");
                const show_cancel = buttons.includes("cancel");
                if(show_ok && show_cancel){
                    this.state.btn_ok ="button left";
                    this.state.btn_cancel ="button right";
                }else{
                    this.state.btn_ok = show_ok?"button":"button non";
                    this.state.btn_cancel = show_cancel?"button":"button non";
                }
            }
            
            this.cb = cb;

            this.update();

            /** @type {HTMLDialogElement} */
            const dialog = this.$("dialog");
            dialog.showModal();
        });

        this.obs_dialog.on("update-message", (message) => {
            this.state.message = message;
            this.update();
        });

        this.obs_dialog.on("close", () => {
            /** @type {HTMLDialogElement} */
            const dialog = this.$("dialog");
            dialog.close();
            this.root.dataset.open = false;
        });
    },
    onclickButton(result, e) { // eslint-disable-line no-unused-vars
        if(this.cb){
            this.cb(result);
        }
    },
    oncancel(e) {
        if(this.on_cancel){
            this.on_cancel();
        }
        e.preventDefault();
    }
};