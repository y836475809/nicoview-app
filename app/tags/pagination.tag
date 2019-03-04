<pagination>
    <style scoped>
        :scope {

        }
        .column {
            display: inline-block;
            user-select: none;
        }
        input {
            width: 50px;
        }
        div[class^="column icono-"]:hover{
            background: gray;    
        }
    </style>

    <div class="column icono-caretLeft" onclick={this.onclickBack}></div>
    <input class="column" type="tel" name="sample" style="text-align: right;" 
        value={this.current_page} onkeypress={this.onkeypress}/>
    <div class="column"> / {this.total_pages}</div>
    <div class="column icono-caretRight" onclick={this.onclickForward}></div>
    <div class="column">{this.total_count}</div>

    <script>
        this.current_page = 1;
        this.total_pages = 0;
        this.total_count = 0;

        this.setTotalPages = (pages) => {
            this.total_pages = pages;
            this.update();
        };
        
        this.setTotaCount = (total_count) => {
            this.total_count = total_count;
            this.update();
        };

        this.onkeypress = (e) =>{
            if(e.key=="Enter"){
                this.opts.onmovepage(this.current_page);
                return;
            }
            if(!/^[0-9]+$/.test(e.key)){
                e.returnValue = false;
            }
        };

        this.onclickBack = () =>{
            if(this.current_page > 1){
                this.current_page -= 1;
                this.update();

                this.opts.onmovepage(this.current_page);
            }
        };

        this.onclickForward = () =>{
            if(this.current_page < this.total_pages){
                this.current_page += 1;
                this.update();

                this.opts.onmovepage(this.current_page);
            }
        };

    </script>
</pagination>