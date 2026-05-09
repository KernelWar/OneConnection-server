const { ipcMain, shell } = require('electron')

function registerMainIpc({
    configPaths,
    configStore,
    getMainWindow,
    serverManager,
    showNetworkDialog,
    showPortInUseDialog,
    socketService,
    state
}) {
    ipcMain.on('setHost', (event, newhost) => {
        state.setHost(newhost)
        serverManager.getExpressApp().set('host', newhost)
    })

    ipcMain.on('setPort', (event, newport) => {
        state.setPort(newport)
        serverManager.getExpressApp().set('port', newport)
    })

    ipcMain.on('desconectClient', () => {
        socketService.desconectedClient()
        removeDevice()
    })

    ipcMain.on('fixConnection', () => {
        configStore.writeFixedDevice(configPaths.fixDevice, {
            system: global._system,
            device: global._device,
            uuid: global._uuid
        })
    })

    ipcMain.on('removefixConnection', () => {
        configStore.clearFixedDevice(configPaths.fixDevice)
    })

    ipcMain.on('resetSocketServer', () => {
        configStore.writeServerConfig(configPaths.server, {
            host: state.getHost(),
            port: state.getPort()
        })
        serverManager.reset({
            host: state.getHost(),
            port: state.getPort()
        })
    })

    ipcMain.on('closeAll', () => {
        serverManager.stop()
        const window = getMainWindow()
        if (window) {
            window.close()
        }
    })

    ipcMain.on('getDataStreamWebContent', (source) => {
        const window = getMainWindow()
        if (window) {
            window.webContents.send('getDataStream', source)
        }
    })

    ipcMain.on('activateStreamWebContent', (source) => {
        console.log('-> Activate stream')
        const window = getMainWindow()
        if (window) {
            window.webContents.send('activateStream', source)
        }
    })

    ipcMain.on('stopStreamWebContent', () => {
        console.log('-> Stop stream')
        const window = getMainWindow()
        if (window) {
            window.webContents.send('stopStream')
        }
    })

    ipcMain.on('finalizeStreamWebContent', () => {
        console.log('-> Finalize stream')
        const window = getMainWindow()
        if (window) {
            window.webContents.send('finalizeStream')
        }
    })

    ipcMain.on('openPayPal', () => {
        shell.openExternal('https://paypal.me/KernelWar?locale.x=es_XC')
    })

    ipcMain.on('checkInterface', () => {
        showNetworkDialog()
    })

    function removeDevice() {
        state.resetDeviceState()
        if (global._fix == true) {
            configStore.clearFixedDevice(configPaths.fixDevice)
        }
    }

    return {
        showPortInUseDialog
    }
}

module.exports = {
    registerMainIpc
}
