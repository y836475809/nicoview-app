<mylist-page>
    <style scoped>
        :scope {
            width: 100%;
            height: 100%;
        }
    </style>      
    
    <split-page-templete>
        <yield to="sidebar">
            <div>content1</div>
        </yield>
        <yield to="main-content">
            <mylist-content></mylist-content>
        </yield>
    </split-page-templete>

    <script>
        /* globals app_base_dir riot*/
        require(`${app_base_dir}/tags/mylist-content.tag`);  
        require(`${app_base_dir}/tags/split-page-templete.tag`);  
        riot.mount("mylist-content");
        riot.mount("split-page-templete");
    </script>
</mylist-page>