const { logger } = require("./logger");
const myapi = require("./my-api");

/**
 * @param {ModalDialog} modal_dialog 
 * @param {MyObservable} dialog_obs 
 * @param {{message: String, cb:Function}} dailog_params
 * @param {()=>void} func 
 * @returns 
 */
const progressDailog = async (modal_dialog, dialog_obs, dailog_params, func) => {
    if(modal_dialog.isOpend()){
        return;
    }
    dialog_obs.trigger("show", {
        message: dailog_params.message,
        buttons: ["cancel"],
        cb: dailog_params.cb
    });
    try {
        await func();
    } catch (error) {
        if(!error.cancel){
            logger.error(error);
            await myapi.ipc.Dialog.showMessageBox({
                type: "error",
                message: error.message
            });
        }
    }
    dialog_obs.trigger("close");
};

module.exports = {
    progressDailog,
};