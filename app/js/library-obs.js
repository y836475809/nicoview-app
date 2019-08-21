
const getLibraryData = (obs, video_id) =>{
    return new Promise((resolve, reject) => { 
        obs.trigger("library-page:get-item-callback", { 
            video_id: video_id, 
            cb: (data)=>{
                resolve(data);
            }
        });
    });
};

const needConvertVideo = async (obs, video_id) => {
    const library_data = await getLibraryData(obs, video_id);
    if(library_data===null){
        return false;
    }

    const video_type = library_data.video_type;
    return /mp4/.test(video_type)!==true;
};

module.exports = {
    getLibraryData,
    needConvertVideo
};