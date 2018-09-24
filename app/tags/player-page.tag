<player-page>
    <style scoped>
        :scope { 
            display: grid;
            margin: 0;
            width: 100%;
            height: 100%;  
            grid-template-rows: 100px 1fr 100px;
            grid-template-columns: 1fr 1fr;  
        }
        #player-tags-content{
            grid-row: 1 / 2;
            grid-column: 1 / 3; 
            background-color: darkgray;
        }  
        #player-video-content{
            grid-row: 2 / 3;
            grid-column: 1 / 3; 
            background-color: blueviolet;
        }  
        #player-controls-content{
            grid-row: 3 / 4;
            grid-column: 1 / 3; 
            background-color: aqua;
        }  
        #player-video {
            object-fit: contain;
            object-position: center center;
            height: calc(100vh - 200px);
            width: 100%;        
        }
    </style>

    <div id="player-tags-content">
        <player-tags></player-tags>
    </div>
    <div id="player-video-content">
        <div id="player-video">
            <player-video></player-video>
        </div>
    </div>
    <div id="player-controls-content">
        <player-controls></player-controls>
    </div>

    <script>
        const base_dir = remote.getGlobal('sharedObj').base_dir;
        let riot = require('riot');

        require(`${base_dir}/app/tags/player-tags.tag`);
        require(`${base_dir}/app/tags/player-video.tag`);
        require(`${base_dir}/app/tags/player-controls.tag`);
        
        obs.on("resizePlayer", (video_size) => {    
            const dh =  window.outerHeight - this.root.offsetHeight;
            const new_height = video_size.height + 200 + dh;

            const dw = video_size.width - window.innerWidth;
            const new_width = window.outerWidth + dw;

            //window.resizeTo(new_width, new_height);
        });
        
        riot.mount('player-tags');
        riot.mount('player-video');
        riot.mount('player-controls');
    </script>  
      
</player-page>