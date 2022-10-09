const time_format = require("../app/js/time-format");

// eslint-disable-next-line no-unused-vars
const buttonFormatter = (opts, id, value, data) => {
    if(!id){
        return "";
    }
    const map = new Map();
    map.set("play", {title:"再生", icon:"fas fa-play"});
    map.set("stack", {title:"後で見る", icon:"fas fa-stream"});
    map.set("bookmark", {title:"ブックマーク", icon:"fas fa-bookmark"});
    map.set("download", {title:"ダウンロードに追加", icon:"fas fa-download"});
    
    const btn_class = "center-hv gridtable-button cmd-btn";
    let buttons = "";
    opts.forEach(opt => {
        if(map.has(opt)){
            const item = map.get(opt);
            buttons +=         
            `<button title=${item.title} data-cmdid=${opt} class="${btn_class}">
                <i data-cmdid=${opt} class="${item.icon} cmd-btn"></i>
            </button>`;
        }
    });
    return `<div style="display:flex; flex-wrap: wrap;">${buttons}</div>`;
};

// eslint-disable-next-line no-unused-vars
const imageFormatter = (id, value, data)=> {
    if(!value){
        return "";
    }
    return `<img class="gridtable-thumbnail" src="${value}"/>`;
};

// eslint-disable-next-line no-unused-vars
const dateFormatter = (id, value, data)=> {
    if(Number.isFinite(value) && value < 0){
        return "";
    }
    return time_format.toDateString(value);
};

// eslint-disable-next-line no-unused-vars
const timeFormatter = (id, value, data)=> {
    if(Number.isFinite(value) && value < 0){
        return "";
    }
    return time_format.toTimeString(value);
};

// eslint-disable-next-line no-unused-vars
const numberFormatter = (id, value, data)=> {
    return value.toLocaleString();
};

// eslint-disable-next-line no-unused-vars
const wrapFormatter = (id, value, data) => {
    return `<div class="wrap-gridtable-cell">${value}</div>`;
};

// eslint-disable-next-line no-unused-vars
const infoFormatter = (mk_content, id, value, data)=> {
    let content = mk_content(value, data);
    if(data.saved){
        content += "<div title='ローカル保存済み' class='state-content state-saved'><i class='fas fa-hdd'></i></div>";
    }
    if(data.reg_download){
        content += "<div title='ダウンロード登録済み' class='state-content state-reg-download'><i class='fas fa-download'></i></div>";
    }
    return content;
};

module.exports = {
    buttonFormatter,
    imageFormatter,
    dateFormatter,
    timeFormatter,
    numberFormatter,
    wrapFormatter,
    infoFormatter,
};