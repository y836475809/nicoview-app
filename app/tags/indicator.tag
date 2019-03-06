<indicator>
    <style scoped>
        div {
            position: absolute;
            width: 100vw;
            height: 100vh;
            text-align: center;
            top: 0;
            /* bottom: 0; */
            left: 0;
            /* right: 0; */
            margin: auto;
            background-color:black;
            opacity: 0.7;
            z-index: 999;
        }
        .display-block{
            display: block;
        }
        .display-none{
            display: none;
        }
        p {
            position: relative;
            top: 50%;
            color: white;
        }   
    </style>

    <!-- <div class={ this.isloading === true ? "display-block" : "display-none" }> -->
    <div >
        <p>{this.opts.msg}</p>
        <div class="button" onclick={this.onclickStop}>stop</div>
    </div>

    <script>
        this.isloading = false;
        this.stopButton = this.opts.onstop===undefined?false:true;

        this.showLoading = (message) => {
            this.isloading = true;
            this.message = message;
            this.update();
        };

        this.hideLoading = () => {
            this.isloading = false;
            this.update();
        };

        this.onclickStop = () =>{
            if(this.opts.onstop){
                this.opts.onstop();
            }
        };
    </script>

</indicator>