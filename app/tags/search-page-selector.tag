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
    </style>

    <div class="container dialog-shadow">
        <div class="header">
            <div class="title center-hv">ページ選択</div>
            <div class="close-button center-hv" title="閉じる" onclick={onclickClose}>
                <i class="fas fa-times"></i>
            </div>
        </div>
        <div class="item-container">
            <div class="item center-hv" each={ item in items } onclick={onclickItem.bind(this,item)}>
                {item}
            </div>
        </div>
    </div>

    <script>
        const obs = this.opts.obs;
        const max_num = 51;
        this.items = [];

        for (let num = 1; num <= max_num; num++) {
            this.items.push(num);
        }

        this.onclickItem = (item, e) => {
            obs.trigger("selected", item);
        };

        this.onclickClose = e => {
            obs.trigger("close");
        };
    </script>
</search-page-selector>