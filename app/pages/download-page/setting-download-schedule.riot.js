
module.exports = {
    /**
     * @type {MyObservable}
     */
    obs:null,

    /**
     * @type {number[]}
     */
    hours:[],

    /**
     * @type {number[]}
     */ 
    minutes:[],
    onBeforeMount(props) {
        this.obs = props.obs;
        
        for (let index = 0; index < 24; index++) {
            this.hours.push(index);
        }
        for (let index = 0; index < 60; index++) {
            this.minutes.push(index);
        }

        /**
         * @param {number} args
         */
        this.obs.on("set-params", (args)=>{
            /** @type {{date:{hour:number, minute:number}, enable:boolean}} */
            const { date, enable } = args;
            const { h_elm, m_elm, ck_elm } = this.getParamElms();
                        
            h_elm.options[date.hour].selected = true;
            m_elm.options[date.minute].selected = true;
            ck_elm.checked = enable;

            this.changeEnable(enable);
        });
    },
    /**
     * 
     * @returns {{
     * h_elm: HTMLSelectElement, 
     * m_elm: HTMLSelectElement, , 
     * ck_elm: HTMLInputElement
     * }}
     */
    getParamElms() {
        const h_elm = this.$(".hour-select");
        const m_elm = this.$(".minute-select");
        const ck_elm = this.$(".schedule-enable-check");
        return { h_elm, m_elm, ck_elm };
    },
    /**
     * 
     * @param {boolean} enable 
     */
    changeEnable(enable) {
        const { h_elm, m_elm } = this.getParamElms();

        h_elm.disabled = !enable;
        m_elm.disabled = !enable;

        /** @type {HTMLElement[]} */
        const label_elms = this.$$(".label");
        label_elms.forEach(elm => {
            if(enable){
                elm.classList.remove("disabled");
            }else{
                elm.classList.add("disabled");
            }   
        });
    },
    onChangeParams(e) { // eslint-disable-line no-unused-vars
        const { h_elm, m_elm, ck_elm } = this.getParamElms();

        const hour = parseInt(h_elm.value);
        const minute = parseInt(m_elm.value);
        const enable = ck_elm.checked;

        this.changeEnable(enable);

        this.obs.trigger("change-params", { 
            date: { hour: hour, minute: minute },
            enable: enable
        });
    }
};
