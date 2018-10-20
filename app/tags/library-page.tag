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
    <base-datatable ref="dt" params={this.params}></base-datatable>
</div>
<context-menu ref="ctm" items={this.items}></context-menu>

<script>
    /* globals base_dir obs opts */
    this.items = [
        { title: 'First item' , itemkey: "First"},
        { title: 'Second item', itemkey: "Second"},
        { title: 'Third item', itemkey: "Third"}
    ];

    const DB = require(`${base_dir}/app/js/db`).DB;
    const serializer = require(`${base_dir}/app/js/serializer`);
    const time_format = require(`${base_dir}/app/js/time_format`);

    require(`${base_dir}/app/tags/base-datatable.tag`);
    require(`${base_dir}/app/tags/context-menu.tag`);

    let db = new DB();

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

        this.refs.dt.setData(datas);
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
        dblclickRow: function(data){
            console.log("lib dblclickRow data:", data); 
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
        let contextmenu = this.refs.ctm;

        this.refs.dt.showContextMenu=(e)=>{
            contextmenu.show(e);
        };

        contextmenu.callback = (e)=>{
            const key = e.key;
            const datas = this.refs.dt.getSelectedDatas();
            console.log("lib conmenu key=", key);
            console.log("lib conmenu data=", datas);
        };        
    });

    obs.on('pageResizedEvent', (size)=> {
        if(this.refs!==undefined){
            this.refs.dt.ress(size);
        }
    });
</script>
</library-page>