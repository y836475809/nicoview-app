const time_format = require("../app/js/time-format");

// eslint-disable-next-line no-unused-vars
const buttonFormatter = (opts, id, value, data) => {
    if(!data.video_id){
        return "";
    }
    const map = new Map();
    map.set("play", {title:"再生", icon:"fas fa-play"});
    map.set("stack", {title:"後で見る", icon:"fas fa-stream"});
    map.set("bookmark", {title:"ブックマーク", icon:"fas fa-bookmark"});
    map.set("download", {title:"ダウンロードに追加", icon:"fas fa-download"});
    
    const btn_class = "center-hv nico-grid-button cmd-btn";
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
    return `<div class="nico-grid-img-holder"/>`;
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
    if(!value){
        return "";
    }
    return value.toLocaleString();
};

// eslint-disable-next-line no-unused-vars
const wrapFormatter = (id, value, data) => {
    if(!value){
        return "";
    }
    return `<div class="nico-grid-wrap-cell">${value}</div>`;
};

// eslint-disable-next-line no-unused-vars
const infoFormatter = (mk_content, id, value, data)=> {
    let content = mk_content(value, data);
    if(data.saved){
        const title = "ローカル保存済み";
        const div_class = "nico-grid-state-content nico-grid-state-saved";
        const btn_class = "fas fa-hdd";
        content += `<div title='${title}' class='${div_class}'><i class='${btn_class}'></i></div>`;
    }
    if(data.reg_download){
        const title = "ダウンロード登録済み";
        const div_class = "nico-grid-state-content nico-grid-state-reg-download";
        const btn_class = "fas fa-hdd";
        content += `<div title='${title}' class='${div_class}'><i class='${btn_class}'></i></div>`;
    }
    return content;
};

/**
 * 
 * @param {string[]} tags 
 * @returns {string}
 */
const mkTagsContent = (tags) => {
    let content = "";
    tags.forEach(tag => {
        content += `<div class='nico-grid-tag-content'>${tag}</div>`;
    });
    const title = tags.join("\n");
    return `<div title="${title}" class='nico-grid-wrap-cell'>${content}</div>`;
};

// eslint-disable-next-line no-unused-vars
const tagsFormatter = (delimiter, id, value, data)=> {
    if(!value){
        return "";
    }
    const tags = Array.isArray(value)?value:value.split(delimiter);
    return mkTagsContent(tags);
};

const cmd_opt = ["play", "stack", "bookmark", "download"];
const formatterItems = [
    {id:"command", ft: buttonFormatter.bind(this, cmd_opt)},
    {id:"thumb_img", ft: imageFormatter},
    {id:"_date", ft: dateFormatter},
    {id:"_time", ft: timeFormatter},
    {id:"_count", ft: numberFormatter}
];
const getFormatter = (id) => {
    const ft_item = formatterItems.find(item => {
        return id.endsWith(item.id);
    });
    const ft = ft_item?ft_item.ft:wrapFormatter;
    return ft;
};

module.exports = {
    buttonFormatter,
    imageFormatter,
    dateFormatter,
    timeFormatter,
    numberFormatter,
    wrapFormatter,
    infoFormatter,
    tagsFormatter,
    getFormatter,
};