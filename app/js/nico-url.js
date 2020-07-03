
const getMylistID = (url) => {
    if(/^https:\/\/www.nicovideo.jp\/mylist\//.test(url)){
        return url.match(/mylist\/\d+$/)[0];
    }
    if(/^https:\/\/www.nicovideo.jp\/user\//.test(url)){
        return url.match(/user\/\d+/)[0];
    }

    throw new Error(`not find mylist id: url=${url}`);
};

module.exports = {
    getMylistID,
};