    
/**
 * ms or str
 * @param {number | string} time 
 */
const toDateString = (time) => {
    const d = new Date(time);
    const year = d.getFullYear();
    // const month = d.getMonth() + 1;
    // const day = d.getDate();
    const month = ("0" + (d.getMonth() + 1)).slice(-2);
    const day = ("0" + d.getDate()).slice(-2);
    const hour = ("0" + d.getHours()).slice(-2);
    const min = ("0" + d.getMinutes()).slice(-2);
    const sec = ("0" + d.getSeconds()).slice(-2);

    return `${year}/${month}/${day} ${hour}:${min}:${sec}`;
};

/**
 * 秒をmm:ss表示にする
 * @param {number} time_sec 秒
 * @returns {string} mm:ss表示
 */
const toTimeString = (time_sec) => {
    const sec = Math.floor(time_sec % 60);
    const min = Math.floor(time_sec / 60);

    const s_min = ("0" + min).slice(-2);
    const s_sec = ("0" + sec).slice(-2);
    
    return `${s_min}:${s_sec}`;
};

/**
 * time 01:00 or 60sec
 * @param {number | string} time 
 */
const toTimeSec = (time) => {   
    if(typeof time === "string"){
        let result_sec = 0;        
        const time_array = time.split(":");
        if(time_array.length == 2){
            result_sec = parseInt( time_array[0] ) * 60 
            + parseInt( time_array[1] );
        }else if(time_array.length == 3){
            result_sec = parseInt( time_array[0] ) * 60 * 60
            + parseInt( time_array[1] ) * 60
            + parseInt( time_array[2] );
        }
        return result_sec;
    }else if(typeof time === "number"){
        return time;
    }
    throw new Error(`${time} is wrong`);
};

module.exports = {
    toDateString,
    toTimeString,
    toTimeSec
};