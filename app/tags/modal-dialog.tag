<modal-dialog>
    <style scoped>
        .container {
            width: 250px;
            height: 150px;
            display: grid;
            grid-template-rows: 1fr 30px;
            grid-template-areas: 
                "item1"
                "item2";
        }

        dialog {
            border: solid 1px #aaa;
            border-radius: 5px;
        }
        dialog::backdrop {
            opacity: 0;
        }

        .message {
            grid-area: item1;
            color: black;
            user-select: none;
        } 

        .button-container {
            grid-area: item2;
            margin: auto;
        }
        .button { 
            display: inline-block;
            text-align: center;
            border: 1px solid #aaa;
            width: 100px;
            height: 30px;
            line-height: 30px;
            cursor: pointer; 
            user-select: none;
        }   
    </style>

    <dialog class="dialog-shadow" oncancel={oncancel}>
        <div class="container">
            <div class="center-hv">
                <p class="message">{message}</p>
            </div>
            <div class="button-container">
                <div show={showok} class="button" onclick="{onclickButton.bind(this,'ok')}">ok</div>
                <div show={showcancel} class="button" onclick="{onclickButton.bind(this,'cancel')}">cancel</div>
            </div>
        </div>
    </dialog>

    <script>
        const obs_dialog = this.opts.obs;

        obs_dialog.on("show", async (args) => {
            const { message, buttons, cb } = args;
            this.message = message;
            this.showok = buttons===undefined ? false : buttons.includes("ok");
            this.showcancel = buttons===undefined ? false : buttons.includes("cancel");
            this.cb = cb;

            this.update();

            const dialog = this.root.querySelector("dialog");
            dialog.showModal();
        });

        obs_dialog.on("update-message", (message) => {
            this.message = message;
            this.update();
        });

        obs_dialog.on("close", () => {
            const dialog = this.root.querySelector("dialog");
            dialog.close();
        });

        this.onclickButton = (result, e) =>{
            if(this.cb){
                this.cb(result);
            }
        };

        this.oncancel = (e) => {
            e.preventDefault();
        };
    </script>
</modal-dialog>