<modal-dialog>
    <style scoped>
        .container {
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

    <dialog oncancel={this.oncancel}>
        <div class="container">
            <div class="center-hv">
                <p class="message">{this.message}</p>
            </div>
            <div class="button-container">
                <div show={this.showok} class="button" onclick="{this.onclickButton.bind(this,'ok')}">ok</div>
                <div show={this.showcancel} class="button" onclick="{this.onclickButton.bind(this,'cancel')}">cancel</div>
            </div>
        </div>
    </dialog>

    <script>
        this.showModal = (message, buttons, cb) => {
            this.message = message;
            this.showok = buttons===undefined ? false : buttons.includes("ok");
            this.showcancel = buttons===undefined ? false : buttons.includes("cancel");
            this.cb = cb;

            const dialog = this.root.querySelector("dialog");
            dialog.showModal();
        };

        this.close = () => {
            const dialog = this.root.querySelector("dialog");
            dialog.close();
        };

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