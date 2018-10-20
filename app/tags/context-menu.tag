<context-menu>
    <style scoped>
        .conmenu{
            width:130px;
            background-color:#f0f0f0;
            border:1px solid #999999;
            display:none;
            position:fixed;
            box-shadow: 2px 2px 4px;
        }
        .conmenu.on{
            display:block;
        }
        .conmenu .conmenu-item{
            list-style:none;
            margin:0px;
            padding:5px;
            font-size: 12px;
            font-family: "Meiryo";
        }
        .conmenu .conmenu-item:hover{
            background-color:rgba(62, 177, 231, 0.2);
        }   
    </style>
    
    <div class="conmenu">
        <div each={this.opts.items} 
        class="conmenu-item" data-itemkey={itemkey}>{title}</div>
    </div>

    <script>
        /* globals $ */
        let self = this;
        this.show = (e)=>{
            let menu = this.root.querySelector("div.conmenu");
            menu.style.left = e.pageX + "px";
            menu.style.top = e.pageY + "px";
            menu.classList.add("on");              
        };

        this.callback = (e)=>{};

        this.on("mount", function () {
            let menu = this.root.querySelector("div.conmenu");

            let elms = this.root.querySelectorAll("div.conmenu .conmenu-item");
            elms.forEach((elem)=>{
                elem.addEventListener("click", function(e){
                    const target = e.target;
                    const key = target.getAttribute("data-itemkey");
                    self.callback({key:key});

                    if(menu.classList.contains("on")){
                        menu.classList.remove("on");
                    }
                    return false;                
                });
            });

            $("html").mousedown(()=>{
                // console.log("html click");
                const elms = this.root.querySelectorAll("div.conmenu .conmenu-item:hover");
                if(elms.length===0 && menu.classList.contains("on")){
                    menu.classList.remove("on");
                }       
            });         
        });
    </script>
</context-menu>