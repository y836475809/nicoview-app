<setting-page>
    <style>
        .setting-page {       
            width: 100%;
            height: 100%;
            overflow: auto;
        }
        
        .setting-page label, 
        .setting-page button {
            height: 25px;
            user-select: none;
        }

        .setting-page button {
            margin-left: 5px;
            cursor: pointer;
        }

        .setting-page input[type='text'] {
            width: 40vw;
            height: 25px;
            border: solid 1px #ccc;
            border-radius: 2px;
            user-select: none;
        }

        .setting-page input[type='checkbox'] {
            height: 25px;
            vertical-align: middle;
        }
        .setting-page input[type='checkbox']:hover {
            cursor: pointer;
        }

        .setting-page .container {
            margin: 10px;
            background-color: white;
            border-radius: 3px;
            border: 1px solid darkgray;
        }

        .setting-page .content {
            padding: 10px;
        }

        .setting-page .title {
            height: 30px;
            border-radius: 3px 3px 0 0;
            padding: 0 10px 0 10px;
            vertical-align: middle;
            background-color: lightblue;
            user-select: none;
        }

        .setting-page .label {
            height: 25px;
            float: left; 
            line-height: 25px;
            user-select: none;
        }

        .setting-page .mg-container {
            margin-right: 15px;
        }
        .setting-page .mg-label {
            margin-right: 5px;
        }
        
        .setting-page .cursor-pointer:hover {
            cursor: pointer;
        }
    </style>

    <div class="setting-page">
        <div class="container">
            <div class="center-v title">マウスジェスチャ設定(右ボタン押しながら)</div>
            <div style="display: flex; flex-wrap:wrap;" class="content">
                <div style="display: flex;" class="mg-container" each={item in state.mouse_gesture_items}>
                    <div class="center-v mg-label">{item.text}</div>
                    <select class="{item.class}" onchange={onchangeMgSelect.bind(this,item)}>
                        <option value="-">-</option>
                        <option value="left">left</option>
                        <option value="right">right</option>
                        <option value="up">up</option>
                        <option value="down">down</option>
                        <option value="left_up">left_up</option>
                        <option value="left_down">left_down</option>
                        <option value="right_up">right_up</option>
                        <option value="right_down">right_down</option>
                    </select>
                </div>
            </div>
        </div>
        <div class="container">
            <div class="center-v title">データの保存先(ブックマーク, 履歴, DB等の保存先)</div> 
            <div class="content" style="display: flex;">
                <input disabled=true class="data-dir-input" type="text" readonly>
                <button title="フォルダ選択" onclick={onclickSelectDataDir}>
                    <i class="far fa-folder-open"></i>
                </button>
            </div>
        </div>
        <div class="container">
            <div class="center-v title">動画の保存先</div>
            <div class="content" style="display: flex;">
                <input disabled=true class="download-dir-input" type="text" readonly>
                <button title="フォルダ選択" onclick={onclickSelectDownloadDir}>
                    <i class="far fa-folder-open"></i>
                </button>
            </div>
        </div>
        <div class="container">
            <div class="center-v title">動画インポート</div>
            <div class="content">
                <div style="display:flex;">
                    <div class="label">動画ファイルを選択(コメント、サムネイル、動画情報もインポートされる)</div>
                    <button title="ファイル選択" onclick={onclickImportFiles}>
                        <i class="far fa-file"></i>
                    </button>
                </div>
            </div>
        </div>
        <div class="container">
            <div class="center-v title">NNDDデータインポート</div>
            <div class="content">
                <div style="display:flex; flex-direction:column; margin-bottom:5px;">
                    <div class="label">NNDDシステムフォルダのパス</div>
                    <div style="display: flex;">
                        <input disabled=true class="nndd-system-path-input" type="text" readonly}>
                        <button title="NNDDシステムフォルダ選択" onclick={onclickNNDDSystemDir}>
                            <i class="far fa-file"></i>
                        </button>
                    </div>
                </div>
                <div style="display:flex; flex-direction:column; margin-top:10px;">
                    <div class="label" style="margin-bottom:-5px;">インポートする対象</div>
                    <div style="display: flex;">
                        <label class="cursor-pointer" style="margin-right: 10px;" each={item in state.import_items} >
                            <input type="checkbox" class={item.name} name={item.name} 
                                onclick={onclickCheckNNDDImportItem.bind(this,item)}/>{item.title}
                        </label>
                    </div>
                    <button style="width:120px; margin-top:10px;" onclick={onclickExecNNDDImport}>
                        インポート実行
                    </button>
                </div>
            </div>
        </div>
        <div class="container">
            <div class="center-v title">ffmpeg実行ファイルのパス(保存済みflv, swfを再生可能な形式に変換する)</div>
            <div class="content" style="display: flex;">
                <input disabled=true class="ffmpeg-path-input" type="text" readonly>
                <button title="ファイル選択" onclick={onclickSelectffmpegPath}>
                    <i class="far fa-file"></i>
                </button>
            </div>
        </div>
        <div class="container">
            <div class="center-v title">キャッシュ</div>
            <div class="content" style="display: flex;">
                <label class="cursor-pointer" title="保存済み動画のみキャッシュ, 変更は再起動後に反映">
                    <input type="checkbox" class="user_icon_cache" onclick={onclickChecUerIconCache}/>
                    ユーザーアイコンをキャッシュする
                </label>
            </div>
        </div>
    </div>

    <script>
        export default window.RiotJS.SettingPage;
    </script>
</setting-page>