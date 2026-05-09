const path = require('path')
const url = require('url')
const { BrowserWindow, nativeImage } = require('electron')

function createMainWindow() {
    const iconPath = path.join(__dirname, '..', '..', 'logo.png')
    const window = new BrowserWindow({
        width: 360,
        height: 600,
        resizable: process.env.NODE_ENV != 'production',
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: false
        },
        transparent: true,
        frame: false,
        center: true,
        maximizable: false,
        show: false
    })

    window.loadURL(url.format({
        pathname: path.join(__dirname, '..', '..', 'src', 'index.html'),
        protocol: 'file',
        slashes: true
    }))

    window.removeMenu()
    window.setIcon(nativeImage.createFromPath(iconPath))
    window.once('ready-to-show', () => {
        window.show()
    })

    if (process.env.NODE_ENV != 'production') {
        window.webContents.openDevTools()
    }

    return window
}

module.exports = {
    createMainWindow
}
