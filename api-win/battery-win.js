const batteryLevel = require('battery-level');
 

function getBatteryLevel(){
    return batteryLevel()
}

module.exports = { getBatteryLevel }
