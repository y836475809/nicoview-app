<mylist-page>
    <split-page-templete>
        <yield to="sidebar">
            <div>content1</div>
        </yield>
        <yield to="main-content">
            <div>content2</div>
        </yield>
    </split-page-templete>

    <script>
        /* globals app_base_dir riot*/
        require(`${app_base_dir}/tags/split-page-templete.tag`);  
        riot.mount("split-page-templete");
    </script>
</mylist-page>