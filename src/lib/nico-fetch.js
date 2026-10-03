const cheerio = require("cheerio");
const { NicoAPI } = require("./niconico");

const user_agent = process.env["user_agent"];

/**
 * 
 * @param {string} url 
 * @returns string
 */
const getCustomUrl = (url) => {
    return url.replace('https://', 'my-app://');
}

const getVideoAudioPairs = (domand) => {
    const videos = domand.videos.filter((v) => v.isAvailable);
    videos.sort((a, b) => b.qualityLevel - a.qualityLevel);

    const audios = domand.audios.filter((v) => v.isAvailable);
    audios.sort((a, b) => b.qualityLevel - a.qualityLevel);

    const videoAudioPairs = [];
    for (const video of videos) {
        for (const audio of audios) {
            videoAudioPairs.push([video.id, audio.id]);
        }
    }
    return videoAudioPairs;
}

/**
 * 
 * @param {string} url 
 * @param {AbortController?} abort 
 * 
 * @returns {Promise<Response>}
 */
const fetchGet = async (url, abort) => {
    const cutomUrl = getCustomUrl(url);
    const headers = new Headers({'User-Agent': user_agent});
    return await fetch(cutomUrl, {
        headers: headers,
        method: 'GET',
        signal: abort?.signal
    });
}

/**
 * 
 * @param {string} url  
 * @param {Headers} headers 
 * @param {any} json 
 * @param {AbortController?} abort 
 * 
 * @returns {Promise<Response>}
 */
const fetchPost = async (url, headers, json, abort) => {
    const cutomUrl = getCustomUrl(url);
    const json_str = JSON.stringify(json);
    headers.append('User-Agent', user_agent);
    headers.append('Content-Type', 'application/json');
    headers.append('Content-Length', `${json_str.length}`);
    return await fetch(cutomUrl, {
        headers: headers,
        method: 'POST',
        body: json_str,
        signal: abort?.signal
    });
}

/**
 * 
 * @param {string} videoId 
 * @param {string} watchTrackId 
 * @param {any} domand 
 * @returns {Promise<string>}
 */
const fetchContentUrl = async (videoId, watchTrackId, accessRightKey, domand) => {
    // const right_key = domand.accessRightKey;
    const quality = getVideoAudioPairs(domand);
    const url = `https://nvapi.nicovideo.jp/v1/watch/${videoId}/access-rights/hls?actionTrackId=${watchTrackId}`;
    const headers = new Headers([
        ['User-Agent', user_agent],
        ['X-Access-Right-Key', accessRightKey],
        ['x-frontend-id', '6'],
        ['x-frontend-version', '0'],
        ['x-request-with', 'https://www.nicovideo.jp']
    ]);
    const res = await fetchPost(url, headers,
        {
            "outputs": quality
        }, null);
    const resJson = await res.json();
    const content_url = resJson.data.contentUrl;
    return content_url;
}


module.exports = {
    fetchGet,
    fetchPost,
    fetchContentUrl
};