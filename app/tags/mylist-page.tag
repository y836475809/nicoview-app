<mylist-page>
    <style scoped>
        :scope {
            width: 100%;
            height: 100%;
        }
    </style>      
    
    <split-page-templete>
        <yield to="sidebar">
            <mylist-sidebar></mylist-sidebar>
        </yield>
        <yield to="main-content">
            <mylist-content></mylist-content>
        </yield>
    </split-page-templete>
</mylist-page>