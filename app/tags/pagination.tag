<pagination>
    <style scoped>
    .pagination-container{
            display: grid;
            grid-template-rows: 1fr;
            grid-template-columns: 20px 50px 20px 50px;
            grid-template-areas: "area1 area2 area3 area4";

            display: flex;
            justify-content: center;
            align-items: center;
            margin-left: 20px;   
        }

        .label {
            user-select: none;
        }
        .back-button {
            grid-area: area1;
        }
        .page-input {
            grid-area: area2;
        }     
        input {
            width: 50px;
            height: 30px;
        }
        .forward-button {
            grid-area: area3; 
        }
        .total-label {
            grid-area: area4;
        }

        [class^="icono-caret"]:hover{
            color: lightgray;
            cursor: pointer;
        }
        .icono-caretLeft {
            transform: scale(0.8) rotate(180deg);
        }
        .icono-caretRight {
            transform: scale(0.8);
        }
    </style>
    <div class="pagination-container">
        <div class="icono-caretLeft back-button" onclick={this.onclickBack}></div>
        <div class="page-input">
            <input type="tel" name="sample" style="text-align: right;" 
                value={this.current_page} onkeypress={this.onkeypress}/>
            <div class="column label"> / {this.total_pages}</div>
        </div>
        <div class="icono-caretRight forward-button" onclick={this.onclickForward}></div>
        <div class="label total-label">ヒット件数: {this.total_count}</div>
    </div>
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

        this.resetPage = () => {
            this.current_page = 1;
            this.total_pages = 0;
            this.total_count = 0;  
            this.update();
        };

        this.onkeypress = (e) =>{
            if(e.key=="Enter"){
                const num = parseInt(e.target.value);
                if(isNaN(num)){
                    return;
                }
                this.current_page = num;
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