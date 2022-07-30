<play-stack-page>
    <style>
        :host {
            --page-width: 300px;
            --item-height: 80px;
            --thumb-size: 80px;
            --icon-size: 40px;
            --item-duration: 300ms;
        }

        .stack-container {
            width: var(--page-width);
            min-height: 80px;
            max-height: calc(100vh 
                - var(--right-sidebar-page-top) - 30px);
            overflow-x: hidden;
        }

        .stack-item {
            display: flex;
            height: var(--item-height);
            border-bottom: 1px solid lightgrey;
            cursor: pointer;
            overflow: hidden;
        }
        .stack-item-hide { 
            height: 0;  
        } 
        .stack-item-show-anime {
            height: var(--item-height);
            transition: height var(--item-duration);
        }
        .stack-item-hide-anime {
            height: 0;
            transition: height var(--item-duration);
        }
        .stack-item:hover {
            background-color: #6190cd6b;
        }
        
        .thumb {
            object-fit: contain;
            width: var(--thumb-size);
            height: var(--thumb-size);
        }
        .title-wraper {
            width: calc(100% - var(--thumb-size) - var(--icon-size) - 5px);
            height: 100%;
        }
        .title {
            margin-left: 5px;
            margin-right: 5px;
            text-overflow: ellipsis;
            white-space: nowrap;
            overflow: hidden;
        }

        .delete-button {
            opacity: 0;
        }
        .stack-item:hover > .delete-button {
            opacity: 1;
        }
        .delete-button > i {
            font-size: var(--icon-size);
            color: gray;
        }
        .delete-button > i:hover {
            color: black;
        }

        .thumb,
        .title,
        .delete-button {
            user-select: none;
        }
    </style>

    <div class="stack-container">
        <div class={getItemClass(item)} data-id={i} each={ (item, i) in state.items }>
            <img class="thumb" src={item.thumb_img} onclick={onclickItem.bind(this,item)}/>
            <div class="title-wraper center-v" onclick={onclickItem.bind(this,item)}>
                <div style="display:flex; flex-direction:column;">
                    <div class="title" title={item.title} >
                        {item.title}
                    </div> 
                    <div class="title">{getTime(item)}</div>
                </div>
            </div>
            <div class="delete-button center-hv" title="削除"
                onclick={onclickDelete.bind(this,i)}>
                <i class="fas fa-times"></i>
            </div>
        </div>
    </div>

    <script>
        export default window.RiotJS.PlayStackPage;
    </script>
</play-stack-page>