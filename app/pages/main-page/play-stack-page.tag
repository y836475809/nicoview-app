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
        /* globals riot */
        const myapi = window.myapi;
        const { Command } = window.Command;
        const { toTimeString } = window.TimeFormat;
        const main_obs = riot.obs;

        export default {
            state:{
                items:[]
            },
            item_duration:300,
            onBeforeMount() {
                this.getTime = (item) => {
                    const time = item.time?item.time:0;
                    return toTimeString(time);
                };

                main_obs.on("play-stack-page:add-items", async (args) => {
                    const { items } = args;

                    this.addItems(items);

                    const cp_items = JSON.parse(JSON.stringify(this.state.items));
                    cp_items.forEach(item => {
                        delete item.state;
                    });
                    await myapi.ipc.Stack.updateItems(cp_items);
                });

                this.getItemClass = (item) => {
                    return`stack-item center-v ${item.state}`;
                };
            },
            async onMounted() {
                const prop = getComputedStyle(this.root).getPropertyValue("--item-duration");
                this.item_duration = parseInt(prop);

                const items = await myapi.ipc.Stack.getItems();
                this.addItems(items);
            }, 
            addItems(items) {
                items.forEach(item => {
                    item.state = "stack-item-hide";
                });
                this.state.items = items.concat(this.state.items);
                this.update();

                setTimeout(() => { 
                    this.state.items.forEach(item => {
                        item.state = "stack-item-show-anime";
                    });
                    this.update();
                }, 50);
            },
            onclickItem(item, e) { // eslint-disable-line no-unused-vars
                Command.play(item, false);
            },
            onclickDelete(i, e) { // eslint-disable-line no-unused-vars
                this.state.items[i].state = "stack-item-hide-anime";
                this.update();

                setTimeout(() => { 
                    this.state.items.splice(i, 1);
                    this.state.items.forEach(item=>{
                        item.state = "";
                    });
                    this.update();
                    const cp_items = JSON.parse(JSON.stringify(this.state.items));
                    cp_items.forEach(item => {
                        delete item.state;
                    });
                    myapi.ipc.Stack.updateItems(cp_items).then();
                }, this.item_duration);   
            }
        };
    </script>
</play-stack-page>