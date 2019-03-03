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
        /* div[class^="column icono-"] {
            transform: scale(0.8);
        } */
        div[class^="column icono-"]:hover{
            background: gray;    
        }
    </style>

    <div class="column icono-caretLeft" onclick={this.onclickBack}></div>
    <input class="column" type="tel" name="sample" style="text-align: right;" 
        value={this.current_page} onkeypress={this.onkeypress}/>
    <div class="column"> / {this.total_pages}</div>
    <div class="column icono-caretRight" onclick={this.onclicForward}></div>

    <script>
        this.current_page = 1;
        this.total_pages = 10;

        
        this.onkeypress = (e) =>{
            console.log(e);
            if(e.key=="Enter"){

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
            }
        };

        this.onclicForward = () =>{
            if(this.current_page < this.total_pages){
                this.current_page += 1;
                this.update();
            }
        };

    </script>
</pagination>