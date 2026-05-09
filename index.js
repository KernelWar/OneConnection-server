const environment = require('./environment/environment')
const { app, dialog, ipcMain } = require('electron')
const socketService = require('./socket/socket-app')
const { registerMainIpc } = require('./main/ipc/register-main-ipc')
const { createServerManager } = require('./main/services/server-manager')
const configStore = require('./main/services/config-store')
const state = require('./main/state')
const { configureUpdater } = require('./main/updater/configure-updater')
const { createMainWindow } = require('./main/windows/main-window')

process.env.NODE_ENV = environment.env.NODE_ENV

const configPaths = {
    server: environment.env.pathConfigServer,
    fixDevice: environment.env.pathConfigFixDevice
}

const autoUpdater = configureUpdater({
    getMainWindow: state.getMainWindow
})

const serverManager = createServerManager({
    socketService,
    onPortInUse: showPortInUseDialog
})

registerMainIpc({
    configPaths,
    configStore,
    getMainWindow: state.getMainWindow,
    serverManager,
    showNetworkDialog: checkInterface,
    showPortInUseDialog,
    socketService,
    state
})

ipcMain.on('checkUpdateApp', () => {
    autoUpdater.checkForUpdatesAndNotify()
})

const instances = app.requestSingleInstanceLock()

if (instances == false) {
    app.exit()
} else {
    app.on('ready', () => {
        const serverConfig = configStore.readServerConfig(configPaths.server)
        state.initializeRuntimeState(serverConfig)

        if (serverConfig.host == '127.0.0.1') {
            checkInterface()
        }

        serverManager.start(serverConfig)

        const window = createMainWindow()
        state.setMainWindow(window)
    })
}

function checkInterface() {
    dialog.showMessageBox(null, {
        type: 'info',
        title: 'Atención',
        message: 'Necesitas estar conectado a una red',
        detail: 'Una vez que te conectes a una red WiFi o cableada dirígete a\nConfiguración>Interfaz de red y selecciona una opción'
    })
}

function showPortInUseDialog() {
    dialog.showMessageBox(null, {
        type: 'error',
        title: 'Atención',
        message: 'Puerto ocupado, OneConnection server DESACTIVADO',
        detail: 'La aplicación intenta iniciar en el puerto ' + state.getPort() + ' pero ya está siendo ocupado por otro programa\ndiríjase a Configuración>Puerto e ingrese un puerto valido'
    })
}
