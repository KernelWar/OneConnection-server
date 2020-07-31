const { audio } = require('system-control');


 function setVolume(vol) {
    return audio.volume(vol)
}

async function getVolume() {
    return audio.volume()
}

module.exports = { setVolume, getVolume }