const myapi = require("../../js/my-api");

/**
 * 
 * @param {string} name 
 * @param {number} value 
 */
const changeParams = async(name, value) => {
    const params = await myapi.ipc.Config.get("player.contextmenu", 5);
    params[name] = value;
    await myapi.ipc.Config.set(`player.contextmenu.${name}`, value);
};
/**
 * 
 * @param {RiotComponent} tag 
 * @param {string} name 
 * @param {number[]} items 
 * @param {number} value 
 */
const setRadioValue = (tag, name, items, value) => {
    const index = items.findIndex(item => item === value);
    /** @type {HTMLInputElement[]} */
    const elms = tag.$$(`input[name='${name}']`);
    elms[index].checked = true;
};

module.exports = {
    menu_num_items:[5, 10, 20],
    onBeforeMount(props) { // eslint-disable-line no-unused-vars
    },
    async onMounted() {
        const params = await myapi.ipc.Config.get("player.contextmenu", {
            history_num: 5,
            stack_num: 5
        });
        setRadioValue(this, "history_num", this.menu_num_items, params.history_num);
        setRadioValue(this, "stack_num", this.menu_num_items, params.stack_num);
    },
    async onchangeHistoryMenuItemNum(item, e) { // eslint-disable-line no-unused-vars
        await changeParams("history_num", parseInt(item));
    },
    async onchangeStackMenuItemNum(item, e) { // eslint-disable-line no-unused-vars
        await changeParams("stack_num", parseInt(item));
    }
};