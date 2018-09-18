
function format(time_ms) {
    const d = new Date(time_ms);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hour = ('0' + d.getHours()).slice(-2);
    const min = ('0' + d.getMinutes()).slice(-2);
    const sec = ('0' + d.getSeconds()).slice(-2);

    return `${year}/${month}/${day} ${hour}:${min}:${sec}`;
}

exports.format = format;