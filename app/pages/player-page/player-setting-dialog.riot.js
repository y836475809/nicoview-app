/* globals riot */

/** @type {MyObservable} */
const player_obs = riot.obs;

module.exports = {
    onBeforeMount() {
        player_obs.on("player-setting-dialog:show", (args) => {
            /** @type {{ng_items:NGItems}} */
            const { ng_items } = args;

            /** @type {HTMLDialogElement} */
            const dialog = this.$("dialog");
            dialog.showModal();

            player_obs.trigger("setting-ng-comment:ng-items", ng_items);
        });
    },
    onclickClose(e) { // eslint-disable-line no-unused-vars
        /** @type {HTMLDialogElement} */
        const dialog = this.$("dialog");
        dialog.close();
    }
};