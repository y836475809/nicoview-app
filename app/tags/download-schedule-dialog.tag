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

        .download-schedule-dialog .hour-select,
        .download-schedule-dialog .minute-select {
            width: 50px;
        }

        .hour-select:focus,
        .minute-select:focus {
            outline: none;
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

    <dialog class="download-schedule-dialog dialog-shadow" oncancel={oncancel}>
        <div class="container">
            <div class="params-container center-hv">
                <input type="checkbox" class="schedule-enable-check" name="schedule-enable">
                <div class="label">毎日</div>
                <select class="hour-select">
                    <option each={hour in hours} value={hour}>{hour}</option>
                </select>
                <div class="label"> : </div>
                <select class="minute-select">
                    <option each={minute in minutes} value={minute}>{minute}</option>
                </select>
                <div class="label">にダウンロード開始</div>
            </div>
            <div class="button-container">
                <div class="button" onclick="{onclickButton.bind(this,'ok')}">ok</div>
                <div class="button" onclick="{onclickButton.bind(this,'cancel')}">cancel</div>
            </div>
        </div>
    </dialog>

    <script> 
        const obs =  this.opts.obs;

        this.hours = [];
        this.minutes = [];
        for (let index = 0; index < 24; index++) {
            this.hours.push(index);
        }
        for (let index = 0; index < 60; index++) {
            this.minutes.push(index);
        }

        obs.on("show", async (args) => {
            const { date, enable, cb } = args;

            this.root.querySelector(".hour-select").options[date.hour].selected = true;
            this.root.querySelector(".minute-select").options[date.minute].selected = true;
            this.root.querySelector(".schedule-enable-check").checked = enable;
            this.cb = cb;

            const dialog = this.root.querySelector("dialog");
            dialog.showModal();
        });

        const close = () => {
            const dialog = this.root.querySelector("dialog");
            dialog.close();
        };

        this.onclickButton = (result, e) =>{
            if(this.cb){
                const h_elm = this.root.querySelector(".hour-select");
                const hour = parseInt(h_elm.value);
                
                const m_elm = this.root.querySelector(".minute-select");
                const minute = parseInt(m_elm.value);

                const ck_elm = this.root.querySelector(".schedule-enable-check");
                const enable = ck_elm.checked;
                
                this.cb({
                    type: result,
                    date: {hour: hour, minute: minute},
                    enable:enable
                });
            }
            close();
        };

        this.oncancel = (e) => {
            e.preventDefault();
        };
    </script>
</download-schedule-dialog>