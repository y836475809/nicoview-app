const { window_obs } = require("../../js/my-observable");

/** @type {MyObservable} */
const player_obs = window_obs;

module.exports = {
    onBeforeMount() {
        player_obs.on("player-setting-dialog:show", (args) => {
            /** @type {{ng_commnet_items:NGCommentItem[]}} */
            const { ng_commnet_items } = args;

            /** @type {HTMLDialogElement} */
            const dialog = this.$("dialog");
            dialog.showModal();

            player_obs.trigger("setting-ng-comment:set-items", ng_commnet_items);
        });
    },
    onclickClose(e) { // eslint-disable-line no-unused-vars
        /** @type {HTMLDialogElement} */
        const dialog = this.$("dialog");
        dialog.close();
    }
};