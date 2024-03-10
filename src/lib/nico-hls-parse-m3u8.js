
const getFilename = (uri) => {
    const url = new URL(uri);
    const array = url.pathname.split("/");
    const last = array.slice(-1)[0];
    return last;
};

const getQuality = (filename) => {
    // video-h264-1080p.m3u8
    // video-h264-720p.m3u8
    const m = filename.match(/video-h264-(?<q>[0-9]+)p/);
    const quality = Number(m.groups.q);
    return quality;
};

/**
 * 
 * @param {string} text 
 * @returns {Map}
 */
const parseManifestM3u8 = (text) => {
    const lines = text.split('\n');
    let rep_text = text;
    const dict = new Map();
    const videos = [];
    for (const [i, line] of lines.entries()) {
        if (line == "") {
            continue;
        }
        if (/#EXT-X-MEDIA:/.test(line)) {
            const m_uri = line.match(/URI="(?<uri>[^"]*)"/);
            const m_gid = line.match(/GROUP-ID="(?<gid>[^"]*)"/);
            const uri = m_uri.groups.uri;
            const filename = getFilename(uri);
            const gid = m_gid.groups.gid;
            dict.set("audio",  {
                uri: uri,
                filename: filename,
                group_id: gid
            });
            rep_text = rep_text.replace(uri, `${filename}`);
        }
        if (/#EXT-X-STREAM-INF:/.test(line)) {
            const m_res = line.match(/RESOLUTION=(?<res>[^,]*)/);
            const uri = lines[i + 1];
            const filename = getFilename(uri);
            const quality = getQuality(filename);
            const video_dict = {
                resolution: m_res.groups.res,
                uri: uri,
                filename: filename,
                quality: quality,
                line: line
            };
            videos.push(video_dict);
            rep_text = rep_text.replace(uri, `${filename}`);
        }
    }
    videos.sort((a, b) => b.quality - a.quality);
    dict.set("video", videos);
    dict.set("rep_text", rep_text);
    return dict;
};

/**
 * 
 * @param {string} text 
 * @returns {Map}
 */
const parseMediaM3u8 = (text) => {
    const lines = text.split('\n');
    let rep_text = text;
    const dict = new Map();
    for (const [i, line] of lines.entries()) {
        if (line == "" || /#EXT-X-ENDLIST/.test(line)) {
            continue;
        }
        if (/#EXT-X-MAP:/.test(line)) {
            const m_uri = line.match(/URI="(?<uri>[^"]*)"/);
            const uri = m_uri.groups.uri;
            const filename = getFilename(uri);
            dict.set(filename, {
                uri: uri,
                filename: filename
            });
            rep_text = rep_text.replace(uri, `${filename}`);
        }
        if (/#EXT-X-KEY:/.test(line)) {
            const m_uri = line.match(/URI="(?<uri>[^"]*)"/);
            const uri = m_uri.groups.uri;
            const filename = getFilename(uri);
            dict.set("key", {
                uri: uri,
                filename: filename
            });
            rep_text = rep_text.replace(uri, `${filename}`);
        }
        if (/#EXTINF:/.test(line)) {
            const uri = lines[i + 1];
            const filename = getFilename(uri);
            dict.set(filename, {
                uri: uri,
                filename: filename
            });
            rep_text = rep_text.replace(uri, `${filename}`);
        }
    }
    dict.set("rep_text", rep_text);
    return dict;
};

module.exports = {
    parseManifestM3u8,
    parseMediaM3u8,
};