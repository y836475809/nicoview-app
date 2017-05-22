<player ref="palyermain">
    <div id="container">
        <style scoped>
             :scope {
                position: absolute;
                width: 100%;
                background-color: #cccccc;
            }
        </style>
        <!--<div id="view">-->
        <video id="player" preload='metadata' controls>
        </video>
        <!--</div>-->
    </div>
    <div ref="playerctr" id="player-ctr">
        <button id="play-btn" onclick='{ invert }'>start</button>
        <button id="stop-btn">stop</button>
        <button id="add-btn">add</button>
    </div>

    <script>
        let getContentSize = () => {
            let w = window.innerWidth - 16
            let h = window.innerHeight - 16
            return { width: w, height: h }
        }


        invert = () => {
            console.log('invert')
        }


        
        this.on('mount', function () {
            console.log('mount')

            let ff = () => {
                console.log('resizeend')

                let h = window.innerHeight - 16
                this.refs.palyermain.style.height = (h) + "px"
            }
            const timeout = 200
            let timer
            window.addEventListener('resize', () => {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    ff()
                }, timeout);
            })
        })
    </script>

</player>