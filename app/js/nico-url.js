
const NICO_URL =  Object.freeze({
    VIDEO: "https://www.nicovideo.jp",
    MSG: "https://nmsg.nicovideo.jp",
    SEARCH: "https://api.search.nicovideo.jp",
});

const getURLKind = (url) => {
    if(/^https:\/\/www.nicovideo.jp\/mylist\//.test(url)){
        return "mylist";
    }
    if(/^https:\/\/www.nicovideo.jp\/user\//.test(url)){
        return "user";
    }
    if(/^https:\/\/www.nicovideo.jp\/watch\//.test(url)){
        return "watch";
    }   
    if(/^https:\/\//.test(url)){
        return "other";
    }
    if(/^http:\/\//.test(url)){
        return "other";
    }
    if(url == "#"){
        return "pound";
    }

    throw new Error(`unknown kind url=${url}`);
};

const getMylistID = (url) => {
    const kind = getURLKind(url);
    if(kind=="mylist"){
        return url.match(/mylist\/\d+$/)[0];
    }
    if(kind=="user"){
        return url.match(/user\/\d+/)[0];
    }

    throw new Error(`not find mylist id: url=${url}`);
};

/**
 * mylist_id: mylist/* or user/*
 * @param {string} mylist_id 
 */
const getMylistURL = (mylist_id) => {
    if(/^mylist\/\d+/.test(mylist_id)){
        return `${NICO_URL.VIDEO}/${mylist_id}`;
    }
    if(/^user\/\d+/.test(mylist_id)){
        return `${NICO_URL.VIDEO}/${mylist_id}/video`;
    }

    throw new Error(`not find mylist id: url=${mylist_id}`);
};

const getWatchURL = (video_id) => {
    return `${NICO_URL.VIDEO}/watch/${video_id}`;
};

module.exports = {
    getURLKind,
    getMylistID,
    getMylistURL,
    getWatchURL,
    NICO_URL,
};