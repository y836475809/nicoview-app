<library-sidebar>
    <style>
        .library-sidebar {
            width: 100%;
            height: 100%;
            background-color: var(--control-color);
        }
    </style>

    <div class="library-sidebar">
        <listview 
            obs={obs_listview}
            name={name}
            geticon={geticon}
            gettooltip={gettooltip}>
        </listview>
    </div>

    <script>
        export default window.RiotJS.LibrarySidebar;
    </script>
</library-sidebar>