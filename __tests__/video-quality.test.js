const test = require("ava");
const  {getQuality} = require("../src/lib/nico-hls-request");

const getDomand = () => {
    return {
        videos:[
            {
                id: "video-h264-480p",
                isAvailable: true,
                label: "480p",
                qualityLevel: 1,
            },
            {
                id: "video-h264-720p",
                isAvailable: true,
                label: "720p",
                qualityLevel: 2,
            },
            {
                id: "video-h264-1024p",
                isAvailable: true,
                label: "1024p",
                qualityLevel: 3,
            },   

        ],
        audios: [
            {
                id: "audio-aac-64kbps",
                isAvailable: true,
                qualityLevel: 1,
            },
            {
                id: "audio-aac-192kbps",
                isAvailable: true,
                qualityLevel: 2,
            }
        ]
    };
};

test("max quality", t => {
    const domand = getDomand();
    const quality = getQuality(domand);
    t.is(quality.is_max_quality, true);
    t.is(quality.label, "1024p"); 
    t.deepEqual(quality.outputs, [
        ["video-h264-1024p", "audio-aac-192kbps"]
    ]); 
});

test("max quality 720p", t => {
    const domand = getDomand();
    domand.videos[2].isAvailable = false;

    const quality = getQuality(domand);
    t.is(quality.is_max_quality, true);
    t.is(quality.label, "720p"); 
    t.deepEqual(quality.outputs, [
        ["video-h264-720p", "audio-aac-192kbps"]
    ]); 
});

test("low quality", t => {
    const domand = getDomand();
    domand.videos[1].isAvailable = false;
    domand.videos[2].isAvailable = false;

    const quality = getQuality(domand);
    t.is(quality.is_max_quality, false);
    t.is(quality.label, "480p"); 
    t.deepEqual(quality.outputs, [
        ["video-h264-480p", "audio-aac-192kbps"]
    ]); 
});


test("max quality 480p", t => {
    const domand =  {
        videos:[
            {
                id: "video-h264-480p",
                isAvailable: true,
                label: "480p",
                qualityLevel: 1,
            }
        ],
        audios: [
            {
                id: "audio-aac-64kbps",
                isAvailable: true,
                qualityLevel: 1,
            }
        ]
    };
    const quality = getQuality(domand);
    t.is(quality.is_max_quality, true);
    t.is(quality.label, "480p"); 
    t.deepEqual(quality.outputs, [
        ["video-h264-480p", "audio-aac-64kbps"]
    ]); 
});
