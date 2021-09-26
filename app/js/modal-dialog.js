/* globals riot */

class ModalDialog {
    constructor(parent, id, props){
        const elem = document.createElement("div");
        elem.id = id;
        parent.appendChild(elem);
        this.modal_dialog = riot.mount(
            `#${id}`, props, "modal-dialog");
    }
    
    isOpend() {
        return this.modal_dialog[0].root.dataset.open=="true";
    }
}

module.exports = {
    ModalDialog,
};