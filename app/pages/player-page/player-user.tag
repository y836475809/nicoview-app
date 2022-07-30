<player-user>
    <style>
        :host {
            --user-name-height: 30px;
            --user-thumbnail-size: 60px;
            overflow-x: hidden;
            overflow-y: hidden;
        }    
        
        .user-container {
            width: 100%;
            height: 100%;
            border-radius: 2px;
            margin-right:  5px;
        } 
        .user-thumbnail {
            user-select: none;
            margin: 5px 0 5px 5px; 
            width: var(--user-thumbnail-size); 
            height: var(--user-thumbnail-size); 
        }
        .user-name {
            user-select: none;
            vertical-align: middle;
        }
        .userlist-link {
            margin-top: 5px;
            margin-left: 5px;
            color: blue;
            text-decoration: underline;
            cursor: pointer;
        }

        .user-container-normal {
            width: 100%;
            height: 100%;
            border: 1px solid var(--control-border-color);
        }
        .user-container-normal .user-name {
            margin-left: 5px;
        }

        .user-container-popup {
            position: absolute;
            right: 5px; 
            border: solid 1px #aaa;
            border-radius: 3px;
            background-color: white; 
            box-shadow: 0 8px 10px 1px rgba(0,0,0,0.14), 0 3px 14px 2px rgba(0,0,0,0.12), 0 5px 5px -3px rgba(0,0,0,0.3);
            z-index: 999;
            padding: 5px;          
        }
        .user-container-popup .user-name {
            margin-top: 5px;
            margin-left: 5px;
        }
        .user-container-popup .icon-button {
            margin-left: auto;
        }

        .user-description {
            padding: 2px;
            width: 100%;
            height: 100%;

            /* TODO とりあえずwindow幅50% */
            max-width: 50vw;
            
            border-top: 1px solid var(--control-border-color);
            overflow-x: auto;
            overflow-y: auto;         
        }
        .user-container-normal .user-description {
            height: calc(100% - var(--user-name-height));
        }
        .user-description.html {
            white-space:nowrap; 
        } 
        .user-description.text {
            height: calc(100% - var(--user-name-height));
            white-space: normal;
        } 

        .icon {
            font-size: 20px;
            color: gray;
        }
        .icon:hover {
            color: black;
        }
        .icon-button {
            height: 30px;
            width: 30px;
            cursor: pointer;
        }
    </style>

    <div class="user-container">   
        <div class="user-container-normal">
            <div style="display: flex;" class="center-v">
                <div class="user-name">投稿者: {state.user_nickname}</div>
                <div class="icon-button center-hv" onclick={onclickPopupDescription}>
                    <i title="ポップアップ表示" class="icon far fa-comment-alt"></i>
                </div>
            </div>
            <div class="user-description {state.user_description_class}" onmouseup={oncontextmenu}></div>
        </div>
        <div style="display:none;" class="user-container-popup">
            <div class="user-info", style="display: flex;">
                <img class="user-thumbnail" src={state.user_thumbnail_url}>
                <div>
                    <div class="user-name">投稿者: {getUserNickname()}</div>
                    <div class="userlist-link" onclick={onclickUserListLink}>{getUserListLink()}</div>
                </div>
                <div class="icon-button center-hv" onclick={onclickCloseDescription}>
                    <i title="閉じる" class="icon fas fa-times"></i>
                </div>
            </div>
            <div class="user-description {state.user_description_class}" onmouseup={oncontextmenu}></div>
        </div>
    </div>
    
    <script>
        export default window.RiotJS.PlayerUser;
    </script>
</player-user>