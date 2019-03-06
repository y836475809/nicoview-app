<indicator>
    <style scoped>
        p {
            color: black;
        }   
        .button {
            text-align: center;
            top: 50%;
            border: 1px solid #aaa;
            width: 100px;
            height: 30px;
            line-height: 30px;
            cursor: pointer; 
            user-select: none;
        }   
        dialog {
            border: solid 1px #aaa;
            border-radius: 5px;
            /* box-shadow: 0 8px 10px 1px rgba(0,0,0,0.14), 0 3px 14px 2px rgba(0,0,0,0.12), 0 5px 5px -3px rgba(0,0,0,0.3); */
        }
    </style>

    <dialog oncancel={this.oncancel}>
        <p>{this.message}</p>
        <div class="button" onclick={this.onclickCancel}>cancel</div>
    </dialog>

    <script>
        /* globals obs */

        this.showLoading = (message) => {
            this.message = message;

            const dialog = this.root.querySelector("dialog");
            dialog.showModal();
        };

        this.hideLoading = () => {
            const dialog = this.root.querySelector("dialog");
            dialog.close();
        };

        this.onclickCancel = () =>{
            if(this.opts.oncancel){
                this.opts.oncancel();
            }
        };

        this.oncancel = (e) => {
            e.preventDefault();
        };
    </script>

</indicator>