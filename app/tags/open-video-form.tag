<open-video-form>
    <style scoped>
        :scope {
            --video-id-form-width: 300px;
            --video-id-form-height: 30px;
        }
        .video-id-form-none {
            display: none;
        }
        .video-id-form {
            display: flex;
            position: fixed;
            width: var(--video-id-form-width);
            height: var(--video-id-form-height);
            left: calc(50% - var(--video-id-form-width));
            top: calc(50% - var(--video-id-form-height));
            background-color: rgba(209, 203, 203);
            border-radius: 2px;
            z-index: 10;
        }
        .video-id-form .label {
            width: 20px;
            margin: 5px;    
            user-select: none;
        }
        .video-id-form input {
            width: calc(var(--video-id-form-width) 
                        - 20px - 50px - 20px);
            margin: 3px;
        }
        .video-id-form .play-button {
            width: 50px;
            margin: 2px 0 2px 0;      
        }
        .video-id-form .close-button {
            width: 20px;
            margin: 2px;   
            cursor: pointer;   
            user-select: none;
        }
    </style>

    <div class="{video_id_form_display}">
        <div class="video-id-form">
            <div class="label center-hv">ID</div>
            <input type="text" onkeydown={onkeydownPlay}>
            <button class="play-button" onclick={onclickPlay}>再生</button>
            <div class="close-button center-hv" title="閉じる" onclick={onclickClose}>x</div>
        </div>
    </div>

    <script>
        /* globals app_base_dir */
        const { obsTrigger } = require(`${app_base_dir}/js/riot-obs`);

        const obs = this.opts.obs; 

        const obs_trigger = new obsTrigger(obs);

        this.video_id_form_display = "video-id-form-none";

        const playByVideoID = () => {
            const elm = this.root.querySelector(".video-id-form input");
            const video_id = elm.value;
            obs_trigger.play(obs_trigger.Msg.PLAYER_PLAY, video_id); 
        }

        this.onkeydownPlay = (e) => {
            if(e.code == "Enter"){
                playByVideoID();
            }
        };

        this.onclickPlay = (e) => {
            playByVideoID();
        };

        this.onclickClose = (e) => {
            this.video_id_form_display = "video-id-form-none";
        };

        obs.on("open-video-form:show", () => {
            this.video_id_form_display = "";
        });

    </script>    
</open-video-form>  