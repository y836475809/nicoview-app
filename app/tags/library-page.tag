<library-page id="library-page">
    <style scoped>
        :scope .table-base {
            background-color: #cccccc;
            width: 100%;
            height: 100%;
        } 
    </style>

<div class="table-base">
    <input type="button" value="show" onclick={read}>  
    <base-datatable ref="lib" my_datatable_id="lib-table-id"></base-datatable>
</div>

<script>
    const remote = require('electron').remote;
    const ipc = require('electron').ipcRenderer;

    const shared_obj = remote.getGlobal('sharedObj');
    const base_dir = shared_obj.base_dir;

    const DB = require(`${base_dir}/app/js/db`).DB;
    const serializer = require(`${base_dir}/app/js/serializer`);
    const time_format = require(`${base_dir}/app/js/time_format`);

    require(`${base_dir}/app/tags/base-datatable.tag`);

    let db = new DB();

    let self = this;
    const config = opts.config;

    read(){
        const data_path = config.library_path;
        const dirpath = serializer.load(`${data_path}/db/dirpath.json`);
        const video = serializer.load(`${data_path}/db/video.json`);
        db.setData(dirpath, video);

        let datas = new Array();
        video.forEach((value, key) => {
            datas.push({
                image: db.getThumbPath(key),
                id: key,
                name: value["video_name"],
                creation_date: value["creation_date"],
                pub_date: value["pub_date"],
                play_count: value["play_count"],
                time: value["time"]}
            );
        });

        self.refs.lib.setData(datas);
    };

    this.params = {}
    this.params.dt = {
        columns : [
            { title: 'image' },
            { title: 'id' },
            { title: 'name' },
            { title: 'creation_date' },
            { title: 'pub_date' },
            { title: 'play_count' },
            { title: 'time' }
        ],
        columnDefs: [
            {
                targets: 0,
                orderable: false,
                data: "image",
                render: function (data, type, row, meta) {
                    return `<img src='${data}' width="130" height="100">`
                },
            },
            { targets: 1, data: "id" },
            { targets: 2, data: "name" },
            { 
                targets: 3, 
                data: "creation_date" ,
                render: function (data, type, row, meta) {
                    return time_format.format(data);
                },
            },
            { 
                targets: 4, 
                data: "pub_date",
                render: function (data, type, row, meta) {
                    return time_format.format(data);
                },
            },
            { targets: 5, data: "play_count" },
            { targets: 6, data: "time" }
        ], 
        colResize : {
            handleWidth: 10,
            exclude: [0],
        },
        dom: 'Zlfrtip',  
        scrollY:'400px',
        scrollCollapse:false,
        autoWidth: true,
        paging: false,
        deferRender: true,
        stateSave: true,
        //displayLength: 2,
        //lengthMenu: [ 2, 4, 10, 20, 30, 40, 50 ],
        //displayLength: 4,
        contextMenu: {
            items: {
                "edit": {name: "Edit", icon: "edit"},
                "cut": {name: "Cut", icon: "cut"},
                "copy": {name: "Copy", icon: "copy"},
                "paste": {name: "Paste", icon: "paste"},
                "delete": {name: "Delete", icon: "delete"}
            },
            callback: function(key, data){
                console.log( "clicked: " + key, ", data:", data); 
            }
        },
        dblclickRow: function(data){
            console.log( "dblclickRow data:", data); 
            const video_file_path = db.getVideoPath(data.id);
            const video_type = db.getVideoType(data.id);
            const commnets = db.findComments(data.id);
            const play_data = {
                src: video_file_path,
                type: video_type,
                commnets: []
            };       
            ipc.send('request-show-player', play_data);
        }
    };

    this.on('mount', function () {
        // console.log(this.refs.lib);
    });

    obs.on('pageResizedEvent', function (size) {
        if(self.refs!==undefined){
            self.refs.lib.ress(size);
        }
    });
</script>
</library-page>