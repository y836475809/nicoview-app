<search-page-selector>
    <style scoped>
        :scope {
            --header-height:30px;
            --item-size: 30px;
            --icon-size: 16px;
            --margin: 10px;
        }

        .container {
            width: calc(var(--item-size) * 10 + var(--margin) * 2);
            border-radius: 5px;
            padding: var(--margin);
            background-color: var(--control-color);
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
        const obs = this.opts.obs;
        const max_page_num = 51;
        this.items = [];

        for (let num = 1; num <= max_page_num; num++) {
            this.items.push({
                num:num,
                class_name:"item-disable"
            });
        }

        this.onclickItem = (item, e) => {
            obs.trigger("selected-page-num", { page_num:item.num });
        };

        this.onclickClose = e => {
            obs.trigger("close");
        };

        obs.on("set-data", (args) => {
            const { total_page_num } = args;

            this.items = [];
            for (let num = 1; num <= max_page_num; num++) {
                this.items.push({
                    num:num,
                    class_name:num<=total_page_num?"":"item-disable"
                });
            }

            this.update();
        });
    </script>
</search-page-selector>