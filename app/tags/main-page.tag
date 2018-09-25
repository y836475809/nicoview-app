<main-page>
    <style scoped>
        :scope {
            display:grid;
            grid-template-rows: 80px 1fr;
            grid-template-columns: 1fr 1fr;
            width: 100%;
            height: 100%;
            margin: 0;
        }
        select-page-tabs{
            grid-row: 1 / 2;
            grid-column: 1 / 3;
        }
        #page1 {
            grid-row: 2 / 3;
            grid-column: 1 / 3;
        }
        #page2 {
            grid-row: 2 / 3;
            grid-column: 1 / 3;
        }       
    </style>

    <select-page-tabs></select-page-tabs>
    <div id="page1">
        <library-page></library-page>
    </div>
    <div id="page2">
        <search-page></search-page>
    </div>
    <div id="page3">
        test
    </div>

    <script>
        const remote = require('electron').remote;
        const shared_obj = remote.getGlobal('sharedObj');
        const base_dir = shared_obj.base_dir;
        
        const config = shared_obj.config;

        let riot = require('riot');
        // let obs = riot.observable();

        require(`${base_dir}/app/tags/select-page-tabs.tag`);
        require(`${base_dir}/app/tags/library-page.tag`);
        require(`${base_dir}/app/tags/search-page.tag`);

        this.index = 0;
        let select_page = (index)=>{
            let page1 = document.getElementById("page1");
            let page2 = document.getElementById("page2");
            let page3 = document.getElementById("page3");

            let list = ["none", "none", "none"];
            list[index] = "block";
            page1.style.display = list[0];
            page2.style.display = list[1];
            page3.style.display = list[2];  
        };

        this.on('mount', function () {
            riot.mount('select-page-tabs', {tabs:['Tab 1','Tab 2','Tab 3']});
            riot.mount('#page1 library-page', { "config": config });
            riot.mount('#page2 search-page');             
            select_page(this.index);
            
            this.root.addEventListener('mousedown', function(e){
                obs.trigger("bodyMousedownEvent", e);   
                return false;
            });
        });

        obs.on("selindex", (index) => {
            this.index = index;      
            select_page(index)
        });
        
        obs.on('resizeEndEvent', function (size) {
            obs.trigger("pageResizedEvent", {
                w: size.w, 
                h: size.h - 200 
            });  
        });
    </script>
</main-page>