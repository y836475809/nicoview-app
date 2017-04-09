
const anime = require('anime.min')

var k = []

class CommmentFlow {
    constructor(params) {
        this.commments = []

        this.app = params.app
        this.dummy = params.dummy
    }

    add(commments) {
        this.commments = commments.map(
            function (c, index) {
                elem = document.createElement('div')
                elem.setAttribute('id', 'element-id'+index);
                elem.innerHTML = c.text
                elem.style.position = 'absolute'
                elem.style.left = 0 + 'px'
                elem.style.top = 20 + 'px'
                this.app.appendChild(elem)
                width = elem.getBoundingClientRect().width
                //this.dummy.removeChild(elem)
                return {
                    ele: elem,
                    x: '0px',
                    y: '10px'

                }
            });
        // for (c in commments) {
        //     elem = document.createElement('div')
        //     elem.setAttribute('id', 'element-id');
        //     elem.innerHTML = c.text
        //     elem.style.position = 'absolute'
        //     elem.style.left = 0 + 'px'
        //     elem.style.top = 20 + 'px'
        //     this.dummy.appendChild(elem)
        //     width = elem.getBoundingClientRect().width
        //     this.dummy.removeChild(elem)
        //     this.commments.push(
        //         {
        //             ele: elem,
        //             x: '0px',
        //             y: '10px'

        //         }
        //     )
        // }
    }
}