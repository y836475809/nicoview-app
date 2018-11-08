    
/**
 * ms or str
 * @param {number | string} time 
 */
function toDate(time) {
    const d = new Date(time);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hour = ("0" + d.getHours()).slice(-2);
    const min = ("0" + d.getMinutes()).slice(-2);
    const sec = ("0" + d.getSeconds()).slice(-2);

    return `${year}/${month}/${day} ${hour}:${min}:${sec}`;
}

function toPlayTime(time_sec){
    const sec = parseInt(time_sec % 60);
    let min = parseInt(time_sec / 60);

    const s_min = ("0" + min).slice(-2);
    const s_sec = ("0" + sec).slice(-2);
    
    return `${s_min}:${s_sec}`;
}

module.exports = {
    toDate: toDate,
    toPlayTime: toPlayTime
};