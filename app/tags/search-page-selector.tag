<search-page-selector>
    <style>
        :host {
            --header-height:30px;
            --item-size: 35px;
            --icon-size: 16px;
            --margin: 10px;
        }

        .container {
            width: calc(var(--item-size) * 10 + var(--margin) * 2 + 25px);
            border-radius: 5px;
            padding: var(--margin);
            background-color: white;
        }

        .header {
            display: flex;
            height: var(--header-height);
            width: 100%;
        }
        .title {
            width: calc(100% - var(--icon-size));
            user-select: none;
        }
        .close-button {
            margin-right: 5px;
            margin-left: auto;
            cursor: pointer;
        }
        .close-button > i {
            font-size: var(--icon-size);
            color: gray;
        }
        .close-button:hover > i {
            color: black;
        }

        .item-container {
            display : flex;
            flex-wrap : wrap; 
            overflow-y: auto;
            max-height: calc(100vh - 200px);
        }
        .item {
            width: var(--item-size);
            height: var(--item-size);
            user-select: none;
            cursor: pointer;
        }
        .item:hover {
            background-color: lightgray;
        }
        .item-current-page {
            border: 1px solid gray;
            border-radius: 3px;
        }
        .item-disable {
            color: lightgray;
            pointer-events: none;
        }
    </style>

    <div class="container dialog-shadow">
        <div class="header">
            <div class="title center-hv">ページ選択</div>
            <div class="close-button center-hv" title="閉じる" onclick={onclickClose}>
                <i class="fas fa-times"></i>
            </div>
        </div>
        <div class="item-container">
            <div class="item center-hv {item.class_name}" each={ item in items } 
                onclick={onclickItem.bind(this,item)}>
                {item.num}
            </div>
        </div>
    </div>

    <script>
        export default {
            onBeforeMount(props) {
                this.obs = props.obs;
                this.items = [];

                this.obs.on("set-data", (args) => {
                    const { page_num, total_page_num } = args;

                    this.items = [];
                    for (let num = 1; num <= total_page_num; num++) {
                        let class_name = "";
                        if(page_num == num){
                            class_name = "item-current-page";
                        }else if(num > total_page_num){
                            class_name = "item-disable";
                        }
                        this.items.push({
                            num:num,
                            class_name:class_name
                        });
                    }

                    this.update();
                });
            },
            onclickItem(item, e) {
                this.obs.trigger("selected-page-num", { page_num:item.num });
            },
            onclickClose(e) {
                this.obs.trigger("close");
            }
        };     
    </script>
</search-page-selector>