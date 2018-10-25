<indicator>
    <style scoped>
         div {
            position: absolute;
            width: 100vw;
            height: 100vh;
            text-align: center;
            top: 0;
            bottom: 0;
            left: 0;
            right: 0;
            margin: auto;
            background-color:black;
            opacity: 0.7;
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

    <div class={ this.isloading === true ? "display-block" : "display-none" }>
        <p>{this.message}</p>
    </div>

    <script>
        /* globals obs */
        this.isloading = false;
        
        obs.on("on_load_indicator", (message) => {
            this.isloading = true;
            this.message = message;
            this.update();
        });

        obs.on("on_unload_indicator", () => {
            this.isloading = false;
            this.update();
        });
    </script>

</indicator>