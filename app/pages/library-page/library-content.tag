<library-content>
    <style>
        :host {
            width: 100%;
            height: 100%;
            --search-input-width: 250px;
            --search-button-size: 30px;
            --margin: 5px;
        }

        .library-controls-container {
            margin-bottom: var(--margin);
        }

        .library-controls-container,
        .library-controls-container .search-container {
            display: flex;
        }
        .library-controls-container .item-info{
            width: 150px;
            height: 30px;
            vertical-align: middle;
            user-select: none;
            padding-left: 5px;
        }

        .search-target-container {
            display: flex;
            margin-left: auto;
        }
        .search-target-none {
            display: none;
        }
        .search-target {
            margin-right: 5px;
            user-select: none;
        }
        .search-target > input[type=checkbox] +label {
            cursor: pointer;
            height: 30px;
        }

        .library-controls-container .search-container {
            margin-left: auto;
        }
        
        .library-controls-container .search-input {
            width: var(--search-input-width);
            height: var(--search-button-size);
            font-size: 1.2em;

            border-width: 1px;
            border-right-width: 0px !important;
            border-style: solid;
            border-color: gray;
        }
        .library-controls-container .search-input:focus {
            outline: none;
        }

        .button {
            width: var(--search-button-size);
            height: var(--search-button-size); 
            background-color: white;
            cursor: pointer; 
        }
        .button > i {
            font-size: 20px;
            color: gray;
        }
        .button > i:hover {
            color: black;
        }
        .search-container > .search-button,
        .search-container > .clear-button {
            border: 1px solid gray;
        }
        .search-container > .search-button {
            border-left-width: 0px !important;
            border-right-width: 0px !important;
            width: 20px;
        }
        .search-container > .clear-button {
            border-left-width: 0px !important;
            width: 25px;
        }
        .search-container > .search-button > i,
        .search-container > .clear-button > i {
            font-size: 1.2em;
        }

        .search-container > .toggle-target-button > i {
            font-size: 15px;
        }

        .search-container > .add-button,
        .search-container > .toggle-target-button {
            background-color: rgba(0, 0, 0, 0);
        }

        .library-grid-container {
            width: 100%;
            height: calc(100% - var(--search-button-size) - var(--margin));
            overflow: hidden;
        }

        .library-grid-container .slick-cell.l2.r2 {
            white-space: normal;
        }

        .thumbnail-wrap {
            height: 135px;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .thumbnail-S {
            object-fit: contain;
            width: 130px;
            height: 100px;
        }
        .thumbnail-L {
            object-fit: contain;
            width: 180px;
            height: 135px;
        }
    </style>

    <div class="library-controls-container">
        <div class="item-info center-v">項目数 {state.num_filtered_items.toLocaleString()}/{state.num_items.toLocaleString()}</div>
        <div class="search-container">
            <div class="search-target-container search-target-none">
                <div class="search-target center-v" each={item in search_targets} >
                    <input type="checkbox" id={getSearchTargetElmID(item.id)} />
                        <label for={getSearchTargetElmID(item.id)} class="center-v">{item.title}</label>
                </div>
            </div>
            <div class="button toggle-target-button center-hv" title="検索対象選択の切り替え" onclick={onclickToggleSearchTargets}>
                <i class="fas fa-filter"></i>
            </div>
            <input class="search-input" placeholder="検索" onkeydown={onkeydownSearchInput} />
            <div class="button search-button center-hv" title="検索" onclick={onclickSearch}>
                <i class="fas fa-search"></i>
            </div>
            <div class="button clear-button center-hv" title="全て表示" onclick={onclickShowAll}>
                <i class="fas fa-times-circle"></i>
            </div>
            <div class="button add-button center-hv" title="検索条件を保存" onclick={onclickSaveSearch}>
                <i class="far fa-star"></i>
            </div>
        </div>
    </div>
    <div class="library-grid-container">
        <div class="library-grid"></div>
    </div>

    <script>
        export default window.RiotJS.LibraryContent;
    </script>
</library-content>