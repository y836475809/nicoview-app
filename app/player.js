var riot = require('riot')
var anime = require('animejs')
require('./app/tags/player.tag')
require('./app/tags/controls.tag')

var obs = riot.observable();

riot.mount('player');
riot.mount('controls');

const timeout = 200
let timer
window.addEventListener('resize', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
        obs.trigger("resizeEndEvent", {w:window.innerWidth, h:window.innerHeight});
    }, timeout);
})