const { desktopCapturer } = require('electron')
var navigatorElectron = null


function setNavigator(value){
    navigatorElectron = value
}

async function getVideoSources() {
    const inputSources = desktopCapturer.getSources({
        types: ['window', 'screen'],
        thumbnailSize: {
            width: 600,
            height: 400
        }
    })
    return inputSources;
}

async function selectSource(source) {
    const constraints = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id
            }
        }
    };
    return navigator.mediaDevices.getUserMedia(constraints);    
}

module.exports = { getVideoSources, selectSource, setNavigator }