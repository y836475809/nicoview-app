<download-page>
    <style>
        :host {
            width: 100%;
            height: 100%;
            --control-height: 36px;
            background-color: var(--control-color);
        }

        .download-button { 
            width: 80px;
            height: 30px;
            cursor: pointer;
        }

        .download-button.start { 
            margin-right: 5px;
        }

        .download-button.clear {
            margin-left: 100px;
        } 

        .download-control-container{
            display: flex;
            width: 100%;
            height: var(--control-height);
            background-color: var(--control-color);         
        }
        
        .download-control-container .schedule-container {
            margin-left: auto;
        }

        .download-grid-container {
            width: 100%;
            height: calc(100% - var(--control-height));
            background-color: var(--control-color);
            overflow: hidden;
        }

        .download-state-complete {
            display: inline-block;
            border-radius: 2px;
            padding: 3px;
            background-color: #7fbfff;
        }
    </style>

    <div class="download-control-container">
        <button class="download-button start" disabled={state.dl_disabled} onclick={onclickStartDownload}>開始</button>
        <button class="download-button stop" onclick={onclickStopDownload}>停止</button>
        <button class="download-button clear" title="ダウンロード済みをクリア" onclick={onclickClearDownloadedItems}>クリア</button>
        <div class="schedule-container center-v">
            <setting-download-schedule obs={obs_schedule}></setting-download-schedule>
        </div>
    </div>
    <div class="download-grid-container">
        <div class="download-grid"></div>
    </div>

    <script>
        export default window.RiotJS.DownloadPage;
    </script>
</download-page>