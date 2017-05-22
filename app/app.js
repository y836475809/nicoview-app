

var riot = require('riot');

var debugTemplate = require('./app/tags/debug.tag');

riot.mount('debug', {
    'processVersion': process.versions.node,
    'chromeVersion': process.versions.chrome,
    'electronVersion': process.versions.electron
});