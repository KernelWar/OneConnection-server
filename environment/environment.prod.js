global._pathApp = process.resourcesPath + "/app.asar.unpacked"
const env = {
    NODE_ENV: 'production',
    global: process.resourcesPath + "/app.asar.unpacked",
    pathConfigServer : global._pathApp + "/config/configServer.json",
    pathConfigFixDevice : global._pathApp + "/config/fixDevice.json"
}
module.exports = { env }