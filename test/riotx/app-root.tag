<app-root>
    <h2>{ state.text }</h2>
    <input type="text" value="{ state.text }" oninput="{ onInput }" ref="str" placeholder="入力してください" />
    <button onclick="{ add }">add</button>
    <button onclick="{ delete }">delete</button>
    <ul>
        <li each="{ list in state.lists }">{ list }</li>
    </ul>

    <script>
        const store = this.riotx.get();
        this.state = store.getter("state");
        store.change("changed", (state, store) => {
            this.state = state;
            this.update();
        });

        this.onInput = (e) => {
            const str = this.refs.str.value;
            store.action("updateText", { str });
        };

        this.add = () => {
            store.action("addList");
        };

        this.delete = () => {
            store.action("deleteList");
        };
    </script>
</app-root>