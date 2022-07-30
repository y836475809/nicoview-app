<search-sidebar>
    <style>
        .nico-search-sidebar {
            width: 100%;
            height: 100%;
            background-color: var(--control-color);
        }
        
        .nico-search-item-adjust {
            margin-right: 4px;
        }
    </style>

    <div class="nico-search-sidebar">
        <listview 
            obs={obs_listview}
            geticon={geticon}
            name={name}
            gettooltip={getTooltip}>
        </listview>
    </div>

    <script>
        export default window.RiotJS.SearchSidebar;
    </script>
</search-sidebar>