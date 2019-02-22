<accordion>
    <style scoped>
        ul {
            margin: 0;
            padding: 0;
            background: #f4f4f4;
            list-style: none;
        }

        li {
            overflow-y: hidden;
            max-height: 0;
            transition: all 0.5s;
            cursor: pointer;
        }

        li:hover {
            background-color: #6190cd6b;
        }

        li.selected {
            background-color: #0f468d6b;
        }

        #cp_menu_bar1:checked~#link1 li {
            max-height: 46px;
            opacity: 1;
        }
    </style>

    <input type="checkbox" name="radio" id="cp_menu_bar1" />
    <ul id="link1">
        <li class="acc-item" each={ item, i in this.entries } data-id={i} onclick={this.onclickItem}
            ondblclick={this.ondblclickItem}>
            {item.title}
        </li>
    </ul>

    <script>
        /* globals obs */
        const Sortable = require("sortablejs");
        let sortable = null;
        this.name_id = this.opts.name_id;
        this.entries = this.opts.entries;

        this.gg = () => {
            var obj = this.root.querySelector("#cp_menu_bar1");
            return obj.checked;
        };

        this.chanegExpand = (is_expand) => {
            const elm = this.root.querySelector("#cp_menu_bar1");
            elm.checked = is_expand;
        };

        obs.on(`${this.name_id}-add-items`, (items)=> {
            console.log("add-items = ", items);
            // this.entries.push(item);
            Array.prototype.push.apply(this.entries, items);
            this.update();
        });

        obs.on(`${this.name_id}-get-items`, (cb)=> {
            const order = sortable.toArray();
            const sorted_items = order.map(value=>{
                return this.entries[value];
            });
            cb(sorted_items);
        });

        this.onclickItem = (e) => {
            const id = e.target.getAttribute("data-id");
            const item = this.entries[id];
            console.log("onclickItem id=", id, "item=", item);

            const elms = this.root.querySelectorAll(".acc-item");
            elms.forEach((elm) => {
                elm.classList.remove("selected");
            });
            e.target.classList.add("selected");
        };

        this.ondblclickItem = (e) => {
            const id = e.target.getAttribute("data-id");
            const item = this.entries[id];
            console.log("ondblclickItem id=", id, "item=", item);

            const order = sortable.toArray();
            console.log("ondblclickItem order=", order);

            obs.trigger(`${this.name_id}-dlbclick-item`, item);
        };

        this.on("mount", () => {
            const el = this.root.querySelector("#link1");
            sortable = Sortable.create(el);
            // sortable = Sortable.create(el, {
            //     onSort: (evt) => {
            //         const order = sortable.toArray();
            //         console.log(order);
            //     }
            // });

            this.chanegExpand(true);
        });
    </script>
</accordion>