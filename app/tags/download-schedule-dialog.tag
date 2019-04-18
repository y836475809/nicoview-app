<download-schedule-dialog>
    <style scoped>
        dialog {
            border: solid 1px #aaa;
            border-radius: 5px;
        }

        dialog::backdrop {
            opacity: 0;
        }

        .download-schedule-dialog .container {
            width: 250px;
            height: 150px;
            display: grid;
            grid-template-rows: 1fr 30px;
            grid-template-areas: 
                "item1"
                "item2";
        }

        .download-schedule-dialog .label {
            user-select: none;
        } 

        .download-schedule-dialog .houer-select {
            width: 50px;
        }

        .download-schedule-dialog .params-container {
            grid-area: item1;
            display: flex;
        }

        .download-schedule-dialog .button-container {
            grid-area: item2;
            margin: auto;
        }
        .download-schedule-dialog .button { 
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

    <dialog class="download-schedule-dialog dialog-shadow">
        <div class="container">
            <div class="params-container center-hv">
                <input type="checkbox" class="schedule-enable-check" name="schedule-enable">
                <div class="label">毎日</div>
                <select class="houer-select">
                    <option each={hour in options} value={hour} selected={current==hour}>{hour}</option>
                </select>
                <div class="label">にダウンロード開始</div>
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

        //TODO
        this.onclickButton = (result, e) =>{
            if(this.cb){
                const sel_elm = this.root.querySelector(".houer-select");
                const houer = sel_elm.value;

                const ck_elm = this.root.querySelector(".schedule-enable-check");
                const enable = ck_elm.checked;
                
                this.cb({
                    type: result,
                    houer: houer,
                    enable:enable
                });
            }
            this.close();
        };

        this.oncancel = (e) => {
            e.preventDefault();
        };
    </script>
</download-schedule-dialog>