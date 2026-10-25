import { toTimeString } from "@lib/time-format.js";
import { window_obs } from "@lib/my-observable.js";


/** @type {MyObservable} */
const main_obs = window_obs;

export default {
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
        window.electronAPI.on('stack:additem', async (item) => {
            this.addItems([item]);
        });

        this.getItemClass = (item) => {
            return`stack-item center-v ${item.state}`;
        };
    },
    async onMounted() {
        const prop = getComputedStyle(this.root).getPropertyValue("--item-duration");
        this.item_duration = parseInt(prop);

        const items = await window.electronAPI.invoke('stack:getItems');
        this.state.items = items.concat(this.state.items);
        this.update();
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
        window.electronAPI.invoke('player:play', item.video_id, false)
    },
    /**
     * 
     * @param {number} i 
     * @param {Event} e 
     */
    onclickDelete(i, e) { // eslint-disable-line no-unused-vars
        this.state.items[i].state = "stack-item-hide-anime";
        this.update();

        setTimeout(async () => { 
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
            await window.electronAPI.invoke('stack:saveItems', cp_items);
        }, this.item_duration);   
    }
};