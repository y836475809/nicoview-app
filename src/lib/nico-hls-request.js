import Hls from "hls.js";

export const getQuality = (domand) => {
    /** @type {Array}  */
    const videos = domand.videos;
    videos.sort((a, b) => b.qualityLevel - a.qualityLevel);
    
    let is_max_quality = videos[0].isAvailable;

    const avai_videos = videos.filter(v => v.isAvailable);
    const video = avai_videos[0];
    if(video.label.includes("720")){
        // 720pなら最高画質とする
        is_max_quality = true;
    }

    /** @type {Array}  */
    const avai_audios = domand.audios.filter(v => v.isAvailable);
    avai_audios.sort((a, b) => b.qualityLevel - a.qualityLevel);
    const audio = avai_audios[0];

    return {
        is_max_quality: is_max_quality,
        label: video.label,
        outputs: [[video.id, audio.id]]
    };
};

export class NicoCustomLoader extends Hls.DefaultConfig.loader {
    load(context, config, callbacks) {
        context.url = context.url.replace('https://', 'my-app://');
        super.load(context, config, callbacks);
    }
}
