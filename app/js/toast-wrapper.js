const { clipboard } = require("electron");
const iziToast = require("izitoast");

const isOver = (message) => {
    return message.length > 100;
};

class ToastWrapper {
    constructor(){
        iziToast.settings({
            theme: "dark",
            backgroundColor: "rgb(0, 0, 0, 0.8)",
            titleColor:"white",
            messageColor:"white",
            progressBar:false,
            timeout:false,
            layout: 2,
            maxWidth: 450,
        });
    }
    
    info(title, message){
        iziToast.error({
            layout: 1,
            iconColor: "cyan",
            icon: "fas fa-info",
            title: title,
            message: message,
        }); 
    }

    error(title, message){
        const { display_message, buttons } = this._getOptions(message);
        iziToast.error({
            iconColor: "red",
            icon: "fas fa-times",
            title: title,
            message: display_message,
            buttons: buttons,
        });   
    }

    _getOptions(message){
        const is_over = isOver(message);
        const text = is_over?message.substring(0, 100) + " ...":message;
        const state = is_over?"cut":"";
        const display_message = `<hr class="toast-wrapper-hr"><div class="toast-wrapper-text ${state}">${text}</div>`;

        function toggle_expand_func(msg, instance, toast) {
            const text_elm = toast.querySelector(".toast-wrapper-text");
            text_elm.classList.toggle("cut");
            if(text_elm.classList.contains("cut")){
                text_elm.innerText = msg.substring(0, 100) + " ...";
            }else{
                text_elm.innerText = msg;
            }
        }
        function copy_func(msg, instance, toast) {
            clipboard.writeText(msg);
        }
        const btn1_func = toggle_expand_func.bind(null, message);
        const btn2_func = copy_func.bind(null, message);
        const buttons =  [
            [
                '<button title="表示切り替え"><i class="fas fa-arrows-alt-v"></i></button>', 
                btn1_func
            ], 
            [
                '<button title="クリップボードにコピー"><i class="far fa-clipboard"></i></button>', 
                btn2_func
            ], 
        ];

        return {
            display_message,
            buttons
        };
    }
}

module.exports = {
    ToastWrapper
};