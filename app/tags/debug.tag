<debug>
  <div class="row footer">
    <div class="panel panel-default">
      <div class="panel-body">
        We are using node {opts.processVersion},
        Chromium {opts.chromeVersion},
        and Electron {opts.electronVersion}.<br/>
        Made with <span style="color: #b21818">love</span> by <a href="http://salvatorecriscione.com/">Salvatore Criscione</a>.
      </div>
    </div>
  </div>
  <style scoped>
    .row {
      min-width: 100vw;
    }
    .footer {
      position: absolute;
      /*bottom: 0;*/
      left: 0;
      padding-left: 50px;
      padding-right: 50px;
    }
  </style>
</debug>