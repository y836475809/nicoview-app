<play-stack-page>
    <style scoped>
        :scope {
            --page-width: 300px;
            --item-height: 80px;
            --thumb-size: 80px;
            --icon-size: 20px;
            --item-duration: 300ms;
        }

        .stack-container {
            width: var(--page-width);
            min-height: 80px;
            max-height: calc(100vh 
                - var(--window-titlebar-height)
                - var(--right-sidebar-page-top) - 30px);
            overflow-x: hidden;
        }

        .stack-item {
            display: flex;
            height: var(--item-height);
            border-bottom: 1px solid lightgrey;
            cursor: pointer;
            overflow: hidden;
            transition: height var(--item-duration);  
        }
        .stack-item-hide { 
            height: 0;  
        } 
        .stack-item-show {
            height: var(--item-height);
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
        <div class="stack-item center-v {item.state}" data-id={i} each={ item, i in items }>
            <img class="thumb" src={item.thumb_img} onclick={onclickItem.bind(this,item)}/>
            <div class="title-wraper center-v" onclick={onclickItem.bind(this,item)}>
                <div class="title" title={item.name} >
                    {item.name}
                </div> 
            </div>
            <div class="delete-button center-hv" title="削除"
                onclick={onclickDelete.bind(this,i)}>
                <i class="fas fa-times"></i>
            </div>
        </div>
    </div>

    <script>
        const { ipcRenderer } = window.electron;
        const { IPC_CHANNEL } = window.IPC_CHANNEL;

        const obs = this.opts.obs;
        this.items = [];
        let item_duration = 300;

        this.on("mount", () => {
            const prop = getComputedStyle(this.root).getPropertyValue("--item-duration");
            item_duration = parseInt(prop);
        });

        obs.on("play-stack-page:add-items", async (args) => {
            const { items } = args;
            items.forEach(item => {
                item.state = "stack-item-hide";
            });
            this.items = items.concat(this.items);
            this.update();

            setTimeout(() => { 
                const elms = this.root.querySelectorAll(".stack-item-hide");
                elms.forEach(elm => {
                    elm.classList.add("stack-item-show"); 
                });
                elms.forEach(elm => {
                    elm.classList.remove("stack-item-hide"); 
                    elm.classList.remove("stack-item-show"); 
                });
            }, 50);
        });

        this.onclickItem = (item, e) => {
            ipcRenderer.send(IPC_CHANNEL.PLAY_BY_VIDEO_ID, {
                video_id: item.id,
                time: 0
            });
        };

        this.onclickDelete = (i, e) => {
            const elms = this.root.querySelectorAll(".stack-item");
            elms[i].classList.add("stack-item-hide"); 
            setTimeout(() => { 
                this.items.splice(i, 1);
                this.update();
            }, item_duration);   
        };
    </script>
</play-stack-page>