<download-schedule-dialog>
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

        .houer-select {
            width: 100px;
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

    <dialog class="dialog-shadow">
        <div class="container">
            <div class="center-hv">
                <input type="checkbox" name="schedule-enable">
                <p class="message">{this.message}</p>
                <select class="houer-select">
                    <option each={hour in options} value={hour} selected={current==hour}>{hour}</option>
                </select>
            </div>
            <div class="button-container">
                <div class="button" onclick="{this.onclickButton.bind(this,'ok')}">ok</div>
                <div class="button" onclick="{this.onclickButton.bind(this,'cancel')}">cancel</div>
            </div>
        </div>
    </dialog>

    <script> 
        this.options = [];
        for (let index = 0; index < 24; index++) {
            this.options.push(index);
        }

        this.showModal = (hour, enable, cb) => {
            this.current = hour;
            this.enable = enable;
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
                const elm = this.root.querySelector(".houer-select");
                const houer = elm.value;
                this.cb({
                    result: result,
                    houer: houer
                });
            }
            this.close();
        };

        this.oncancel = (e) => {
            e.preventDefault();
        };
    </script>
</download-schedule-dialog>