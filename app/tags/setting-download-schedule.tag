<setting-download-schedule>
    <style scoped>
        .download-schedule-container {
            display: flex;
        }

        .download-schedule-container .label {
            margin-left: 5px;
            margin-right: 5px;
            user-select: none;
        } 

        .download-schedule-container .label.disabled {
            color: gray;
        }

        .download-schedule-container .hour-select,
        .download-schedule-container .minute-select {
            height: 25px;
            width: 50px;
        }

        .hour-select:focus,
        .minute-select:focus {
            outline: none;
        }
    </style>
    
    <div class="download-schedule-container center-hv">
        <input type="checkbox" class="schedule-enable-check" name="schedule-enable"
            onchange={onChangeParams}>
        <div class="label">毎日</div>
        <select class="hour-select" onchange={onChangeParams}>
            <option each={hour in hours} value={hour}>{hour}</option>
        </select>
        <div class="label">:</div>
        <select class="minute-select" onchange={onChangeParams}>
            <option each={minute in minutes} value={minute}>{minute}</option>
        </select>
        <div class="label">にダウンロード開始</div>
    </div>

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

        const getParamElms = () => {
            const h_elm = this.root.querySelector(".hour-select");
            const m_elm = this.root.querySelector(".minute-select");
            const ck_elm = this.root.querySelector(".schedule-enable-check");
            return { h_elm, m_elm, ck_elm };
        };

        const changeEnable = (enable) => {
            const { h_elm, m_elm } = getParamElms();

            h_elm.disabled = !enable;
            m_elm.disabled = !enable;

            const label_elms = this.root.querySelectorAll(".label");
            label_elms.forEach(elm => {
                if(enable){
                    elm.classList.remove("disabled");
                }else{
                    elm.classList.add("disabled");
                }   
            });
        };

        this.onChangeParams = (e) =>{
            const { h_elm, m_elm, ck_elm } = getParamElms();

            const hour = parseInt(h_elm.value);
            const minute = parseInt(m_elm.value);
            const enable = ck_elm.checked;

            changeEnable(enable);

            obs.trigger("change-params", { 
                date: { hour: hour, minute: minute },
                enable: enable
            });
        };

        obs.on("set-params", (args)=>{
            const { date, enable } = args;
            const { h_elm, m_elm, ck_elm } = getParamElms();
                        
            h_elm.options[date.hour].selected = true;
            m_elm.options[date.minute].selected = true;
            ck_elm.checked = enable;

            changeEnable(enable);
        });
    </script>
</setting-download-schedule>