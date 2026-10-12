/**
 * @typedef {import('@/types/events.js').DialogEmitter} DialogEmitter 
 * @typedef {import('riot').RiotComponent<{ emitter: DialogEmitter}, { showok:boolean, showcancel:boolean, message:string }>} Base
 * @typedef {{ 
 *  onClickOK(): void
 *  onClickCancel(): void
 * }} DialogMethods
 * @typedef {Base & DialogMethods} Composite
 * @typedef {Partial<Composite> & ThisType<Composite>} DialogComponent
 */

/**
 * @type DialogComponent
 */
export default {
    state: {
        showok:false,
        showcancel:false,
        message:"",
    },
    onBeforeMount(props, state) {
        this.state.message = "";
    },
    onMounted(props, state) {
        props.emitter.on('dialog:open', (data) => {
            this.update({
                showok: data.showok,
                showcancel: data.showcancel,
                message: data.message
            });
            this.$('#my-dialog')?.showModal();
        });
        props.emitter.on('dialog:update-message', (data) => {
            this.update({
                message: data.message
            });
        });
        props.emitter.on('dialog:close', () => {
            this.$('#my-dialog')?.close();
        });
    },
    onUnmounted(props, state) {
        if (props.emitter) {
            props.emitter.off('dialog:open');
            props.emitter.off('dialog:update-message');
        }
    },
    onClickOK(){
        this.props.emitter.emit('dialog:ok');
        this.props.emitter.off('dialog:ok'); 
    },
    onClickCancel(){
        this.props.emitter.emit('dialog:cancel');
        this.props.emitter.off('dialog:cancel'); 
    }
};
