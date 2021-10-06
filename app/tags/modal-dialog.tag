<modal-dialog data-open="false">
    <style>
        .message-modal-dialog {
            border: solid 1px #aaa;
            border-radius: 5px;
        }

        .message-modal-dialog::backdrop {
            opacity: 0;
        }

        .message-modal-dialog .container {
            width: 250px;
            height: 150px;
            display: grid;
            grid-template-rows: 1fr 30px;
            grid-template-areas: 
                "item1"
                "item2";
        }

        .message-modal-dialog .message {
            grid-area: item1;
            color: black;
            user-select: none;
        } 

        .message-modal-dialog .button-container {
            grid-area: item2;
            margin: auto;
        }
        .message-modal-dialog .button { 
            display: inline-block;
            text-align: center;
            border: 1px solid #aaa;
            width: 100px;
            height: 30px;
            line-height: 30px;
            cursor: pointer; 
            user-select: none;
        }   
        .message-modal-dialog .button:hover {
            background-color: skyblue;
        }
        .message-modal-dialog .non {
            display: none;
        }

        .message-modal-dialog .button.left {
            margin-right: 5px;
        }
        .message-modal-dialog .button.right {
            margin-left: 5px;
        }
           
    </style>

    <dialog class="message-modal-dialog dialog-shadow" oncancel={oncancel}>
        <div class="container">
            <div class="center-hv">
                <p class="message">{state.message}</p>
            </div>
            <div class="button-container">
                <div class={state.btn_ok} onclick="{onclickButton.bind(this,'ok')}">OK</div>
                <div class={state.btn_cancel} onclick="{onclickButton.bind(this,'cancel')}">Cancel</div>
            </div>
        </div>
    </dialog>

    <script>
        export default {
            state: {
                message:"",
                showok:false,
                showcancel:false,
                btn_ok:"button",
                btn_cancel:"button"
            },
            obs_dialog: null,
            on_cancel: null,
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

                    const dialog = this.$("dialog");
                    dialog.showModal();
                });

                this.obs_dialog.on("update-message", (message) => {
                    this.state.message = message;
                    this.update();
                });

                this.obs_dialog.on("close", () => {
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
    </script>
</modal-dialog>