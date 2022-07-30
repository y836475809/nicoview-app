<listview>
    <style>
        :host {
            --input-height: 30px;
            --search-button-width: 30px;
            --item-height: 30px;
            --item-duration: 300ms;
            --icon-size: 15px;
        }

        .listview-list {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            background: #f4f4f4;
            list-style: none;
        }

        .listview-item {
            display: flex;
            width: 100%;
            height: var(--item-height);
            padding: 0 0 0 5px;
            cursor: pointer;
            border-bottom: 1px solid lightgrey;
            overflow: hidden;
            user-select: none;
        }

        .listview-item:hover {
            background-color: #6190cd6b;
        }

        .listview-item.selected {
            color: white;
            background-color: #0f468d6b; 
        }
        .listview-item-hide { 
            height: 0;
            padding: 0 0 0 5px;
            border-bottom: 0px;
        } 
        .listview-item-show {
            height: var(--item-height);
            padding: 5px 0 5px 5px;
            border-bottom: 1px solid lightgrey;
        }
        .listview-item-hide-anime { 
            height: 0;
            transition: all var(--item-duration);
        } 
        .listview-item-show-anime {
            height: var(--item-height);
            transition: all var(--item-duration);
        }

        .listview-item-default-icon {
            font-size: var(--icon-size);
            pointer-events: none;
        }
        .listview-item-default-icon-color {
            color: royalblue;
        }
        .listview-item-marked-icon-color {
            color: red;
        }

        .title-wraper {
            padding: 5px 0 5px 0;
            width: calc(100% - var(--icon-size) * 2 - 5px);
            height: 100%;
        }
        .title {
            margin-left: 5px;
            margin-right: 5px;
            text-overflow: ellipsis;
            white-space: nowrap;
            overflow: hidden;
            pointer-events: none;
        }

        .delete-button {
            margin-right: 10px;
            margin-left: auto;
            opacity: 0;
        }
        .listview-item:hover > .delete-button {
            opacity: 1;
        }
        .delete-button > i {
            font-size: var(--icon-size);
            color: gray;
            pointer-events: none;
        }
        .delete-button:hover > i {
            color: black;
        }

        .listview-menu-container {
            width: 100%;
            height: calc(100% - var(--input-height) - 5px);
            overflow-x: hidden;
        }
        
        .listview-input {
            border: solid 1px #ccc;
            border-right-width: 0px !important;
            border-radius: 2px;
            height: var(--input-height);
            width: calc(100% - var(--search-button-width));
            margin-bottom: 5px;
            padding: 2px;   
        }
        .listview-input:focus {
            outline: none;
        }
 
        .search-button > i,
        .clear-button > i {
            font-size: 1.2em;
            color: gray;
        }
        .search-button > i:hover,
        .clear-button > i:hover {
            color: black;
        }
        .search-button,
        .clear-button {
            border: 1px solid #ccc;
            background-color: white;
            height: var(--input-height);
            cursor: pointer;      
        }
        .search-button {            
            border-left-width: 0px !important;
            border-right-width: 0px !important;
            width: calc(var(--search-button-width) - 5px);
        }
        .clear-button {            
            border-left-width: 0px !important;
            width: var(--search-button-width);
        }

        .listview-item-ghost-class {
            background-color: #C8EBFB;
        }
        
        .dblclick > i {
            transition-duration: 0.2s;
        }
        .dblclick:hover > i {
            transform: scale(1.5);
	        transition-duration: 0.2s;
        }
    </style>
    
    <div style="display: flex;">
        <input class="listview-input" placeholder="検索" onkeydown={onkeydownSearchInput}>
        <div class="search-button center-hv" title="検索" onclick={onclickSearch}>
            <i class="fas fa-search"></i>
        </div>
        <div class="clear-button center-hv" title="全て表示" onclick={onclickShowAll}>
            <i class="fas fa-times-circle"></i>
        </div>
    </div>
    <div class="listview-menu-container">
        <ul class="listview-list">
            <li class="listview-item {item.state}" data-id={i} each={ (item, i) in state.items }
                title={getTooltip(item)}>
                <div class="dblclick center-hv" title="クリック動作"
                    onclick={onclickItem.bind(this,item)} 
                    ondblclick={ondblclickItem.bind(this,item)}
                    onmouseup={onmouseUp.bind(this,item)}
                    onmousedown={onmouseDown.bind(this,item)}>
                    <i class={getIconClass(item)}></i>
                </div>           
                <div class="title-wraper center-v"
                    onclick={onclickItemAsdblclick.bind(this,item)} 
                    ondblclick={ondblclickItem.bind(this,item)}
                    onmouseup={onmouseUp.bind(this,item)}
                    onmousedown={onmouseDown.bind(this,item)}>
                    <div class="title">
                        {getTitle(item)}
                    </div> 
                </div>
                <div class="delete-button center-hv" title="削除"
                    onclick={onclickDelete.bind(this,i)}>
                    <i class="fas fa-times"></i>
                </div>
            </li>
        </ul>
    </div>

    <script>
        export default window.RiotJS.Listview;
    </script>
</listview>