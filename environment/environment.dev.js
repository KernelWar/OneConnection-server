const path = require('path')
global._pathApp = path.join(__dirname+"/..")
env = {
    NODE_ENV: 'development',
    global: path.join(__dirname+"/.."),
    pathConfigServer : (path.join(__dirname+"/../", 'config/configServer.json')),
    pathConfigFixDevice : (path.join(__dirname+"/../", 'config/fixDevice.json'))
}
module.exports = { env }