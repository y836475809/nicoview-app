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
            display: flex;
            justify-content: center;
            align-items: center;

            user-select: none;
            width:auto;
        }
        .back-button {
            grid-area: area1;
        }
        .page-input {
            grid-area: area2;
            margin: 0 10px 0 10px;

            display: flex;
            justify-content: center;
            align-items: center;
        }     
        input {
            width: 50px;
            height: 25px;
        }          
        .current-page-label {
            margin-left: 5px;
        }
        .forward-button {
            grid-area: area3; 
        }
        .total-label {
            grid-area: area4;
            margin-left: 5px;
        }

        i[class^="fas fa-chevron"]:hover{
            color: lightgray;
            cursor: pointer;
        }
    </style>
    <div class="pagination-container">
        <div class="back-button" onclick={this.onclickBack}><i class="fas fa-chevron-left fa-2x"></i></div>
        <div class="page-input">
            <input type="tel" name="sample" style="text-align: right;" 
                value={this.current_page} onkeypress={this.onkeypress}/>
            <div class="column label current-page-label"> / {this.total_pages}</div>
        </div>
        <div class="forward-button" onclick={this.onclickForward}><i class="fas fa-chevron-right fa-2x"></i></div>
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