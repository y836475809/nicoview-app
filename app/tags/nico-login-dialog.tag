<nico-login-dialog>
    <style>
        .nico-login-dialog {
            border: solid 1px #aaa;
            border-radius: 5px;
        }

        .nico-login-dialog::backdrop {
            opacity: 0;
        }

        .nico-login-dialog .container {
            width: 350px;
            height: 150px;
            display: grid;
            grid-template-rows: 1fr 50px;
            grid-template-areas: 
                "item1"
                "item2";
        }

        .nico-login-dialog .input-container {
            grid-area: item1;
            color: black;
            user-select: none;
        } 
        .nico-login-dialog .input-container label { 
            width: 120px;
            display:block;
            float: left;
        }   
        .nico-login-dialog .input-container input {
            width: 100%;
        } 

        .nico-login-dialog .button-container {
            grid-area: item2;
            margin: auto;
        }
        .nico-login-dialog .button { 
            display: inline-block;
            text-align: center;
            border: 1px solid #aaa;
            width: 100px;
            height: 30px;
            line-height: 30px;
            cursor: pointer; 
            user-select: none;
        }   
        .nico-login-dialog .button:hover { 
            background-color: lightskyblue;
        }
        .nico-login-dialog .button.left {
            margin-right: 5px;
        }
        .nico-login-dialog .button.right {
            margin-left: 5px;
        }
    </style>

    <dialog class="nico-login-dialog dialog-shadow">
        <div class="container">
            <div class="center-hv input-container">
                <div style="display:block;">
                    <div style="display: flex; margin-bottom: 5px;">
                        <label for="mail">Mail address:</label>
                        <input type="text" id="nico-mail" name="mail" autofocus>
                    </div>
                    <div style="display: flex;">
                        <label for="password">Password:</label>
                        <input type="password" id="nico-pass" name="password" required>
                    </div>
                </div>
            </div>
            <div class="button-container">
                <div class="button left" onclick={onclickLogin}>ログイン</div>
                <div class="button right" onclick={onclickClose}>キャンセル</div>
            </div>
        </div>
    </dialog>

    <script>
        const myapi = window.myapi;

        const getDialog = (tag) => {
            return tag.$("dialog");
        };
        const clean = (tag) => {
            ["#nico-mail", "#nico-pass"].forEach(id =>{
                const elm = tag.$(id);
                elm.value = "";
            });
        };

        export default {
            is_show:false,
            onBeforeMount() {
                myapi.ipc.onOpenLoginDialog(()=>{
                    if(this.is_show){
                        return;
                    }
                    this.is_show = true;
                    const dialog = getDialog(this);
                    dialog.showModal();
                });

                myapi.ipc.onCloseLoginDialog(()=>{
                    this.is_show = false;
                    clean(this);
                    const dialog = getDialog(this);
                    dialog.close();
                });
            },
            onclickLogin() {
                const mail = this.$("#nico-mail");
                const password = this.$("#nico-pass");
                myapi.ipc.login(mail.value, password.value);
            },
            onclickClose() {
                this.is_show = false;
                clean(this);
                const dialog = getDialog(this);
                dialog.close();
            }
        };
    </script>
</nico-login-dialog>