<main-page>
    <style>
        :host {
            --main-sidebar-width: 75px;
            --margin: 5px;
            --page-container-right-space: 20px;
            width: 100%;
            height: 100%;
            margin: 0;
            overflow-y: hidden;
        }

        .main-container {
            width: 100%;
            height: 100%;
            display: flex;
        }

        .page-container.left > * {
            position: absolute;
            height: 100%;
            width: calc(100% - var(--main-sidebar-width) * 2); 
            overflow: hidden;
            padding: var(--margin);
            background-color: var(--control-color);
        }
        .page-container.right > * {
            position: absolute;
            top: var(--right-sidebar-page-top);
            right: calc(var(--main-sidebar-width) + var(--margin) + var(--page-container-right-space));
            overflow-x: hidden; 
            overflow-y: hidden; 
            padding: var(--margin);
            background-color: var(--control-color);
        }
        .page-container.right > div {
            border: 1px solid gray;
            border-radius: 5px;
            padding: 5px;
            background-color: var(--control-color);
        }

        .main-sidebar {
            width: var(--main-sidebar-width);
            height: 100%;
            background-color: #1e2229;
        }
        .main-sidebar .button {
            margin-bottom: 5px;
            text-align: center;
            box-sizing: border-box;
            width: 100%;
            height: 60px;   
            display: flex;
            cursor: pointer;
        }
        .select-button {
            background-color: #303030 !important;
        }
        .main-sidebar .button-border {
            height: 100%;
            width: 8px;
            background-color: #2C7CFF;
            opacity: 0;
        }
        .select-button-border {
            opacity: 1 !important;
        }
        .main-sidebar .button-border + div {
            width: 100%;
        }
        .main-sidebar .button > div {
            pointer-events: none;
        }
        .main-sidebar .button-label {
            margin: 2px;
            text-align: center;
            color: white;   
            font-size: 10px;
            user-select: none;
        }
        .main-sidebar .fas {
            padding-top: 10px; 
            font-size: 24px;
            color: grey;
        }
        .select-icon {
            color: lightgray !important;
        }
        .main-sidebar.right {
            margin-left: auto;
        }

        .download-badge {
            position: relative;
        }
        .download-badge > .item-num {
            position: absolute;
            text-align: center;
            left: 50%;
            top: 0px;
            font-size: 12px;
            line-height: 20px;
            color: white;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background-color: red;
            user-select: none;
        }
    </style>

    <div class="main-container" onmousedown={mousedown} onmouseup={mouseup}>
        <div class="main-sidebar left">
            <div class="button center-v library-button" onclick="{onclickPageSelect.bind(this,'library')}">
                <div class="button-border"></div>
                <div>
                    <i class="center-hv fas fa-book"></i>
                    <div class="button-label">ライブラリ</div>
                </div>
            </div>
            <div class="button center-v search-button" onclick="{onclickPageSelect.bind(this,'search')}">
                <div class="button-border"></div>
                <div>
                    <i class="center-hv fas fa-search"></i> 
                    <div class="button-label">検索</div>
                </div>
            </div>
            <div class="button center-v mylist-button" onclick="{onclickPageSelect.bind(this,'mylist')}"> 
                <div class="button-border"></div>
                <div>
                    <i class="center-hv fas fa-list"></i> 
                    <div class="button-label">マイリスト</div>
                </div>
            </div>
            <div class="button center-v download-button" onclick="{onclickPageSelect.bind(this,'download')}"> 
                <div class="button-border"></div>
                <div>
                    <span class="download-badge center-hv">
                        <i class="fas fa-download"></i>
                        <span class="item-num">{state.donwnload_item_num}</span>
                    </span> 
                    <div class="button-label">ダウンロード</div>
                </div>
            </div>
            <div class="button center-v history-button" onclick="{onclickPageSelect.bind(this,'history')}"> 
                <div class="button-border"></div>
                <div>
                    <i class="center-hv fas fa-history"></i> 
                    <div class="button-label">履歴</div>
                </div>
            </div>
            <div class="button center-v setting-button" onclick="{onclickPageSelect.bind(this,'setting')}">  
                <div class="button-border"></div>
                <div>
                    <i class="center-hv fas fa-cog"></i> 
                    <div class="button-label">設定</div>
                </div>
            </div>
        </div>
        <div class="page-container left">
            <sidebar-page id="library-page" page_name="library"></sidebar-page>
            <sidebar-page id="search-page" page_name="search"></sidebar-page>
            <sidebar-page id="mylist-page" page_name="mylist"></sidebar-page>
            <download-page id="download-page"></download-page>
            <history-page id="history-page"></history-page>
            <setting-page id="setting-page"></setting-page>
        </div>
        <div class="page-container right">
            <div class="bookmark-page dialog-shadow">
                <bookmark-page></bookmark-page>
            </div>
            <div class="play-stack-page dialog-shadow">
                <play-stack-page></play-stack-page>
            </div>
        </div>
        <div class="main-sidebar right">
            <div class="button bookmark-button center-hv" onclick="{onclickTogglePage.bind(this,'bookmark')}">
                <div class="button-border"></div>
                <div>
                    <i class="fas fa-bookmark"></i>
                    <div class="button-label">ブックマーク</div>
                </div>
            </div>
            <div class="button play-stack-button center-hv" onclick="{onclickTogglePage.bind(this,'play-stack')}">
                <div class="button-border"></div>
                <div>
                    <i class="fas fa-stream"></i>
                    <div class="button-label">後で見る</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        export default window.RiotJS.MainPage;
    </script>
</main-page>