<play-stack-page>
    <style>
        :host {
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
                - var(--right-sidebar-page-top) - 30px);
            overflow-x: hidden;
        }

        .stack-item {
            display: flex;
            height: var(--item-height);
            border-bottom: 1px solid lightgrey;
            cursor: pointer;
            overflow: hidden;
            transition: height var(--item-duration),
                padding var(--item-duration),
                border-bottom var(--item-duration);
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
        <div class="stack-item center-v {item.state}" data-id={i} each={ (item, i) in items }>
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
        export default {
            onBeforeMount(props) {
                this.myapi = window.myapi;
                this.Command = window.Command.Command;
                const { toTimeString } = window.TimeFormat;

                this.obs = props.obs;
                this.items = [];
                this.item_duration = 300;

                this.getTime = (item) => {
                    const time = item.time?item.time:0;
                    return toTimeString(time);
                };

                this.obs.on("play-stack-page:add-items", async (args) => {
                    const { items } = args;

                    await this.addItems(items);
                    this.items.forEach(item => {
                        delete item.state;
                    });
                    await this.myapi.ipc.Stack.updateItems(this.items);
                });
            },
            async onMounted() {
                const prop = getComputedStyle(this.root).getPropertyValue("--item-duration");
                this.item_duration = parseInt(prop);

                const items = await this.myapi.ipc.Stack.getItems();
                await this.addItems(items);
            }, 
            addItems(items) {
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
            },
            onclickItem(item, e) {
                this.Command.play(item, false);
            },
            onclickDelete(i, e) {
                const elms = this.root.querySelectorAll(".stack-item");
                elms[i].classList.add("stack-item-hide"); 
                setTimeout(() => { 
                    this.items.splice(i, 1);
                    this.update();
                    this.myapi.ipc.Stack.updateItems(this.items).then();
                }, this.item_duration);   
            }
        };
    </script>
</play-stack-page>