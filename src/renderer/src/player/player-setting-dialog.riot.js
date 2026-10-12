import { window_obs } from "@lib/my-observable.js";

import SettingNgComment from '@renderer/player/setting-ng-comment.riot';
import SettingDisplayComment from '@renderer/player/setting-display-comment.riot';
import SettingPlayerContextmenu from '@renderer/player/setting-player-contextmenu.riot';

/** @type {MyObservable} */
const player_obs = window_obs;

export default {
    components: {
        'setting-ng-comment': SettingNgComment,
        'setting-display-comment': SettingDisplayComment,
        'setting-player-contextmenu': SettingPlayerContextmenu,
    },

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