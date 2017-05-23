var riot = require('riot')
require('./app/tags/player.tag')

var obs = riot.observable();

riot.mount('player');

const timeout = 200
let timer
window.addEventListener('resize', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
        obs.trigger("resizeEndEvent", {w:window.innerWidth, h:window.innerHeight});
    }, timeout);
})