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
            width: 280px;
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

        .download-schedule-dialog .houer-select,
        .download-schedule-dialog .minute-select {
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
                    <option each={hour in hours} value={hour} selected={sc_houer==hour}>{hour}</option>
                </select>
                <div class="label"> : </div>
                <select class="minute-select">
                    <option each={minute in minutes} value={minute} selected={sc_minute==minute}>{minute}</option>
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
        this.hours = [];
        this.minutes = [];
        for (let index = 0; index < 24; index++) {
            this.hours.push(index);
        }
        for (let index = 0; index < 60; index++) {
            this.minutes.push(index);
        }

        this.showModal = (date, enable, cb) => {
            this.sc_houer = date.houer;
            this.sc_minute = date.minute;
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
                const h_elm = this.root.querySelector(".houer-select");
                const houer = parseInt(h_elm.value);
                
                const m_elm = this.root.querySelector(".minute-select");
                const minute = parseInt(m_elm.value);

                const ck_elm = this.root.querySelector(".schedule-enable-check");
                const enable = ck_elm.checked;
                
                this.cb({
                    type: result,
                    date: {houer: houer, minute: minute},
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