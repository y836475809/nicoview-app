const myapi = require("../../lib/my-api");
const { Command } = require("../../lib/command");
const { toTimeString } = require("../../lib/time-format");
const { window_obs } = require("../../lib/my-observable");

/** @type {MyObservable} */
const main_obs = window_obs;

module.exports = {
    state:{
        /** @type {StackItem[]} */
        items:[]
    },
    item_duration:300,
    onBeforeMount() {
        /**
         * 
         * @param {StackItem} item 
         * @returns {string}
         */
        this.getTime = (item) => {
            const time = item.time?item.time:0;
            return toTimeString(time);
        };

        main_obs.on("play-stack:add-items", async (args) => {
            /** @type {{items:StackItem[]}} */
            const { items } = args;

            this.addItems(items);

            const cp_items = JSON.parse(JSON.stringify(this.state.items));
            cp_items.forEach(item => {
                delete item.state;
            });
            await myapi.ipc.Stack.updateItems(cp_items);
        });

        this.getItemClass = (item) => {
            return`stack-item center-v ${item.state}`;
        };
    },
    async onMounted() {
        const prop = getComputedStyle(this.root).getPropertyValue("--item-duration");
        this.item_duration = parseInt(prop);

        const items = await myapi.ipc.Stack.getItems();
        this.addItems(items);
    }, 
    /**
     * 
     * @param {StackItem[]} items 
     */
    addItems(items) {
        items.forEach(item => {
            item.state = "stack-item-hide";
        });
        this.state.items = items.concat(this.state.items);
        this.update();

        setTimeout(() => { 
            this.state.items.forEach(item => {
                item.state = "stack-item-show-anime";
            });
            this.update();
        }, 50);
    },
    /**
     * 
     * @param {StackItem} item 
     * @param {Event} e 
     */
    onclickItem(item, e) { // eslint-disable-line no-unused-vars
        Command.play(item, false);
    },
    /**
     * 
     * @param {number} i 
     * @param {Event} e 
     */
    onclickDelete(i, e) { // eslint-disable-line no-unused-vars
        this.state.items[i].state = "stack-item-hide-anime";
        this.update();

        setTimeout(() => { 
            this.state.items.splice(i, 1);
            this.state.items.forEach(item=>{
                item.state = "";
            });
            this.update();
            /** @type {StackItem[]} */
            const cp_items = JSON.parse(JSON.stringify(this.state.items));
            cp_items.forEach(item => {
                delete item.state;
            });
            myapi.ipc.Stack.updateItems(cp_items).then();
        }, this.item_duration);   
    }
};