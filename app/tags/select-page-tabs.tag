<select-page-tabs>
    <style>
        :scope {
            margin: 0 auto;
            width: 100%;
            background-color: #fff;
            box-shadow: 0 6px 40px rgba(201, 50, 16, .5);
        }
        .tabs {
            list-style: none;
            border-bottom: 1px solid #ebebeb;
            background-color: #fafafa;
        }
        .tabs::after {
            display: table;
            content: '';
            clear: both;
        }
        .tabs > li {
            position: relative;
            float: left;
            padding: .8em 0 1em;
            width: 33.33333%;
            color: #6c6c6c;
            text-align: center;
            cursor: default;
        }
        .tabs > li.is-active {
            color: #fd7557;
            font-weight: bold;
        }
        .tabs > li.is-active::before {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            content: '';
            border-top: 3px solid #fd6d4f;
            box-shadow: 0 0 8px rgba(234, 64, 26, .6);
        }
        .content {
            padding: 1.2em 1.4em;
            color: #4c4c4c;
        }
    </style>

    <ul class="tabs">
        <li each="{tab, i in tabs}" class="{is-active: parent.index === i}" onclick="{parent.changeTab}">{tab}</li>
    </ul>    
    <script>    
        var self = this;
    
        // タブのタイトルを配列で管理
        self.tabs = opts.tabs;
        
        // 初回表示時は0番目のタブを表示
        self.index = 0;
    
        // タブをクリックでindexを切り替え
        changeTab(event) {
            self.index = event.item.i;
            obs.trigger("selindex", self.index)
        }
    </script>
</select-page-tabs>