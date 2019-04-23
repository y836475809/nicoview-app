<split-page-templete>
    <style scoped>
        :scope {
            width: 100%;
            height: 100%;
            --right-width: 200px;
            --search-input-width: 200px;
            --search-button-size: 30px;
            display: flex;
        }

        .gutter {    
            width: 4px;
            border-left: 1px solid var(--control-border-color);
            background-color: var(--control-color);
        } 
        .split.left{
            background-color: var(--control-color);
            width: var(--right-width);
        }
        .split.right{
            background-color: var(--control-color);
            width: calc(100% - var(--right-width));
            height: 100%;
            overflow-y: hidden;
        }
    </style>
   
    <div class="split left">
        <yield from="sidebar" />
    </div>
    <div class="gutter"></div>
    <div class="split right">
        <yield from="main-content" />
    </div>
</split-page-templete>