    
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
}

const toTimeString = (time_sec) => {
    const sec = parseInt(time_sec % 60);
    let min = parseInt(time_sec / 60);

    const s_min = ("0" + min).slice(-2);
    const s_sec = ("0" + sec).slice(-2);
    
    return `${s_min}:${s_sec}`;
}

const toTimeSec = (time_str) => {
    let result_sec = 0;
    const time_array = time_str.split(":");
    if(time_array.length == 2){
        result_sec = parseInt( time_array[0] ) * 60 
        + parseInt( time_array[1] );
    }else if(time_array.length == 3){
        result_sec = parseInt( time_array[0] ) * 60 * 60
        + parseInt( time_array[1] ) * 60
        + parseInt( time_array[2] );
    }else{
        throw new Error(`${time_str} is wrong`);
    }
    return result_sec;
};

module.exports = {
    toDateString,
    toTimeString,
    toTimeSec
};