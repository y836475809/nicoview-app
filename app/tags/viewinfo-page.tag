<viewinfo-page>
    <style scoped>
        :scope {
            display: grid;
            grid-template-rows: 100px 100px 1fr;
        }
        #info{
            grid-row: 1 / 2;
            background-color: darkgray;
        } 
        #description{
            grid-row: 2 / 3;
            background-color: darkgray;
        } 
        #comment-list{
            grid-row: 3 / 4;
            background-color: darkgray;
        } 
    </style>
    
    <div id="info">test1</div>
    <div id="description">test2</div>
    <div id="comment-list">test3</div>

    <script>
    </script>
</viewinfo-page>