<library-sidebar>
    <style scoped>
       .library-sidebar > h2 {
            font-size: 1.5em;
            background-color: #2d8fdd;
            color: white;
            text-align: center;
            height: 45px;
            line-height: 45px;
            margin: 0;
            user-select: none;
        }
        .search-item,
        .search-item-fix {
            border-bottom: 1px solid gray;
            padding-left: 10px;
            background-color: white;
            line-height: 30px;
            user-select: none;
            cursor: pointer;
            display: flex;
        }
        .search-item > div,
        .search-item-fix > div  {
            margin: 0;
            width: 100%;
        }
        .search-item-fix {
            border-top: 1px solid gray;
        }
        .search-item:hover,
        .search-item-fix:hover {
            background-color: #eee;
        }
        .search-item-lable.select{
            color: red;
            /* background-color: cadetblue; */
            /* opacity: 0.7; */
        }
        div.search-item-del {
            position: relative;
            margin: 0;
            margin-left: auto;
            width: 20px;
            height: 20px;
            top: 5px;
        }
        div.search-item-del:hover {
            border-radius: 50% 50% 50% 50%;
            background-color: darkgray;
        }
        div.search-item-del > span {
            top: -7px;
            left: -7px;
            color: gray;
            transform: scale(0.5) rotate(45deg);
        }
        div.search-item-del > span:hover {
            color: white;
        }
    </style>

    <div class="library-sidebar">
        <h2>Search</h2>
        <div class="search-item-fix" onclick={onclickClearSearch}>
            <div id="fixed-search-item-lable" class="search-item-lable">Clear</div>
        </div>
        <div class="search items">
            <div class="search-item" each="{ search, i in search_items }" data-id={i} >
                <div class="{ search.selected ? 'search-item-lable select' : 'search-item-lable' }" onmouseup={onmouseupSearchItem}>{ search.label }</div>
                <div class="search-item-del"><span class="icono-cross" data-id={i} onclick={onclickDeleteSearchItem}></span></div>
            </div>
        </div>
    </div>

    <script>
        /* globals obs */
        const path = require("path");
        const Sortable = require("sortablejs");
        const pref = require("../js/preference");
        const serializer = require("../js/serializer");

        const seach_pref_path = path.join(pref.getDataPath(), "seach.json");
        
        try {
            this.search_items = serializer.load(seach_pref_path);
            this.search_items.forEach((item) => {
                item.selected = false;
            });
        } catch (error) {
            this.search_items = [];
        }

        const refresh = (new_search_items) => {
            this.search_items = [];
            this.update();

            this.search_items = new_search_items.slice();
            this.update();
        };

        const savePref = () => {
            serializer.save(seach_pref_path, this.search_items, (error)=>{
                if(error){
                    console.log(error);
                }
            });
        };

        const addSearchItem = (item) => {
            if(!item){
                return;
            }
            this.search_items.push({ label: item, item: item, selected:false });

            const clone_items = this.search_items.slice();
            refresh(clone_items);
            savePref();
        };

        const deleteSearchItem = (data_id) => {
            let new_search_items = [];
            this.search_items.forEach((item, i) => {
                if(i!==data_id){
                    new_search_items.push(item);
                }    
            });
            
            refresh(new_search_items);
            savePref();
        };

        this.onmouseupSearchItem = (e) => {
            let elm = this.root.querySelector("#fixed-search-item-lable.search-item-lable.select");
            if(elm){
                elm.classList.remove("select");
            }

            const data_id = e.item.i;
            this.search_items.forEach((item, i) => {
                if(i===data_id){
                    item.selected = true;
                } else{
                    item.selected = false;
                }   
            });
            this.update();

            const item = e.item.search.item;
            obs.trigger("on_change_search_item", item);
        };

        this.onclickClearSearch = (e) =>{
            let elm = this.root.querySelector("#fixed-search-item-lable.search-item-lable");
            if(elm){
                elm.classList.add("select");
            }

            this.search_items.forEach((item, i) => {
                item.selected = false;
            });
            this.update();

            obs.trigger("on_change_search_item", "");
        };

        this.onclickDeleteSearchItem = (e) => {
            const data_id = parseInt(e.target.getAttribute("data-id"));
            deleteSearchItem(data_id);
        };
        
        obs.on("on_add_search_item", (item)=> {
            addSearchItem(item);
        });

        obs.on("on_clear_search", ()=> {
            this.onclickClearSearch();
        });

        this.on("mount", () => {
            const el = this.root.querySelector(".search.items");
            const sortable = Sortable.create(el, {
                onSort: (evt) => {
                    const  order = sortable.toArray();

                    let sorted_items = [];
                    order.forEach(i => {
                        sorted_items.push(this.search_items[i]);
                    });

                    refresh(sorted_items);
                    savePref();
                }
            });
        });
    </script>
</library-sidebar>