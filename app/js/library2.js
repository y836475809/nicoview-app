const { NicoXMLFile, NicoJsonFile } = require("./nico-data-file");

class Library {
    constructor(){
        this.nico_xml = new NicoXMLFile();
        this.nico_json = new NicoJsonFile();
    }
    createDBItem() {
        return {
            _db_type: "",
            dirpath_id: -1,
            video_id: "",
            video_name: "",
            video_type: "",
            common_filename: "",
            is_economy: false,
            modification_date: -1,
            creation_date: 0,
            pub_date: 0,
            last_play_date: -1,
            play_count: 0,
            time: 0,
            tags: [],
            is_deleted: false,
            thumbnail_size: "S",
        };
    }

    _createLibraryItem(id_dirpath_map, video_item){
        const dir_path = id_dirpath_map.get(video_item.dirpath_id);
        return  {
            db_type: video_item._db_type,
            thumb_img: this._getThumbImgPath(dir_path, video_item),
            id: video_item.video_id,
            name: video_item.video_name,
            creation_date: video_item.creation_date,
            pub_date: video_item.pub_date,
            last_play_date: video_item.last_play_date,
            play_count: video_item.play_count,
            play_time: video_item.time,
            tags: video_item.tags?video_item.tags.join(" "):"",
            thumbnail_size: video_item.thumbnail_size,
            video_type: video_item.video_type
        };
    }

    async getlibraryItems(library){
        const items = await library.getItems();
        const id_dirpath_map = library.id_dirpath_map;
        return items.map(item => {
            return this._createLibraryItem(id_dirpath_map, item);
        });   
    }
    
    async getlibraryItem(library, item){
        const id_dirpath_map = library.id_dirpath_map;
        return this._createLibraryItem(id_dirpath_map, item);
    }
    async getPlayItem(library, video_id){
        const item = await library.getItem(video_id);
        const dir_path = await library._getDir(item.dirpath_id);
        const is_deleted = await library.getFieldValue(video_id, "is_deleted");

        const video_path = this._getVideoPath(dir_path, item);
        const video_type = this._getVideoType(item);
        const comments = this._getComments(dir_path, item);
        const thumb_info = this._getThumbInfo(dir_path, item);

        return {
            video_data: {
                src: video_path,
                type: `video/${video_type}`,
            },
            viewinfo: {
                is_deleted: is_deleted,
                thumb_info:thumb_info,
                
            },
            comments: comments
        };   
    }

    _getDataFileInst(dir_path, video_info){
        const db_type = video_info._db_type;
        if(db_type=="xml"){
            this.nico_xml.dirPath = dir_path;
            this.nico_xml.commonFilename = video_info.common_filename;
            this.nico_xml.videoType = video_info.video_type;
            this.nico_xml.thumbnailSize = video_info.thumbnail_size;
            return this.nico_xml;
        }
        if(db_type=="json"){
            this.nico_json.dirPath = dir_path;
            this.nico_json.commonFilename = video_info.common_filename;
            this.nico_json.videoType = video_info.video_type;
            this.nico_json.thumbnailSize = video_info.thumbnail_size;
            return this.nico_json;
        }

        throw new Error(`${db_type} is unkown`);
    }
    
    _getVideoPath(dir_path, video_info) {
        const datafile = this._getDataFileInst(dir_path, video_info);
        return datafile.videoPath;
    }

    _getThumbImgPath(dir_path, video_info){
        const datafile = this._getDataFileInst(dir_path, video_info);
        return datafile.thumbImgPath;
    }

    _getComments(dir_path, video_info) {
        const datafile = this._getDataFileInst(dir_path, video_info);
        return datafile.getComments();
    }

    _getThumbInfo(dir_path, video_info) {
        const datafile = this._getDataFileInst(dir_path, video_info);
        const thumb_info = datafile.getThumbInfo();
        const thumb_img_path = this._getThumbImgPath(dir_path, video_info);
        thumb_info.video.thumbnailURL = thumb_img_path;
        thumb_info.video.largeThumbnailURL = thumb_img_path;
        return thumb_info;
    }

    _getVideoType(video_info){
        return video_info.video_type;
    }

}