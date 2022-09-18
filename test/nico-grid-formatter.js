
const buttonFormatter = (opts, item) => {
    // if(!item.video_id){
    //     return "";
    // }
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

module.exports = {
    buttonFormatter,
};