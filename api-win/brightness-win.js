const brightness = require('brightness');
 
function getBrightness(){
    return brightness.get()
}
 
function setBrightness(level){
    return brightness.set(level)
}

module.exports = { getBrightness, setBrightness }