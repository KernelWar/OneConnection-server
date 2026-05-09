const log = require('electron-log')
const { autoUpdater } = require('electron-updater')

function configureUpdater({ getMainWindow }) {
    autoUpdater.logger = log
    autoUpdater.logger.transports.file.level = 'info'
    log.info('App starting...')

    function sendStatusToWindow(text) {
        console.log(text)
        const window = getMainWindow()
        if (window) {
            window.webContents.send('status-update', text)
        }
    }

    autoUpdater.on('checking-for-update', () => {
        sendStatusToWindow('Buscando actualizaciones...')
    })

    autoUpdater.on('update-available', (info) => {
        sendStatusToWindow('Hay una nueva versión')
        log.info('info', info)
    })

    autoUpdater.on('update-not-available', (info) => {
        sendStatusToWindow('No hay actualizaciones')
        log.info('info', info)
    })

    autoUpdater.on('error', (err) => {
        sendStatusToWindow('No se pudo actualizar')
        log.info('err', err)
    })

    autoUpdater.on('download-progress', (progressObj) => {
        let speed = 0
        let textSpeed = ''

        if (progressObj.bytesPerSecond > 1024 * 1024) {
            speed = progressObj.bytesPerSecond / 1024 / 1024
            speed = speed.toFixed(2)
            textSpeed = speed + ' Mb/s'
        } else {
            speed = progressObj.bytesPerSecond / 1024
            speed = speed.toFixed(2)
            textSpeed = speed + ' Kb/s'
        }

        let logMessage = textSpeed
        logMessage += '<br>' + progressObj.percent.toFixed(2) + '%'
        logMessage = '<br>' + logMessage + ' (' + (progressObj.transferred / 1024 / 1024).toFixed(2) + 'Mb/' + (progressObj.total / 1024 / 1024).toFixed(2) + 'Mb)'
        sendStatusToWindow(logMessage)
    })

    autoUpdater.on('update-downloaded', (info) => {
        sendStatusToWindow('Descarga finalizada')
        log.info('info', info)
        setTimeout(() => {
            autoUpdater.quitAndInstall()
        }, 5000)
    })

    return autoUpdater
}

module.exports = {
    configureUpdater
}
