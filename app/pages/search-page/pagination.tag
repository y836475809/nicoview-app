<pagination>
    <style>
        :host {
            display: flex;
        }

        .label {
            user-select: none;
            margin-left: 5px;
        }

        .label.page {
            min-width: 80px;
            cursor: pointer;
            border: 1px solid gray;
            border-radius: 3px;
            padding: 5px;
            background-color: white;
        }

        .page-container {
            position: relative;
            display: flex;
        }
        .page-selector {
            display: none;
            position: absolute;
            top: 30px;
            left: 0px;
            z-index: 999;
        }
        .page-selector-show {
            display: block;
        }

        i[class^="fas fa-chevron"] {
            font-size: 20px;
        }

        .navi {
            width: 30px;
            height: 30px;
            cursor: pointer;
        }
        .navi > i {
            color: gray;
        }
        .navi > i:hover {
            color: black;
        }
    </style>

    <div class="navi center-hv" onclick={onclickBack}><i class="fas fa-chevron-left"></i></div>
    <div class="page-container center-hv" >
        <div class="label page center-hv" title="ページ選択" onclick={onclickTogglePageSelector}>
            {state.page_num} / {state.total_page_num}
        </div>
        <search-page-selector class="page-selector" obs={obs_page_selector}> 
        </search-page-selector>
    </div>
    <div class="navi center-hv" onclick={onclickForward}><i class="fas fa-chevron-right"></i></div>
    <div class="label center-hv">ヒット件数: {state.search_result_num.toLocaleString()}</div>

    <script>
        export default window.RiotJS.PagingNation;
    </script>
</pagination>