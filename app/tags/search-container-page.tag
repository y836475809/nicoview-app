<search-container-page>
    <style scoped>
        :scope {
            --right-width: 200px;
            --search-input-width: 200px;
            display: flex;
            height: 100%;
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
        <search-sidebar></search-sidebar>
    </div>
    <div class="gutter"></div>
    <div class="split right">
        <search-page></search-page>
    </div>
</search-container-page>