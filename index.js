const { app, BrowserWindow, Menu, Tray } = require('electron')

const express = require('express')
const http = require('http')
const ip = require('ip')
const cors = require('cors')
const appexpress = express()
const server = http.createServer(appexpress)
const socket = require('./socket/socket-app')
socket.initServer(server)


var host = ip.address()
var port = 8080
appexpress.use(cors())
appexpress.use(express.json())
appexpress.set('port', port)
appexpress.set('host', host)

appexpress.get('/', (req, res) => {
    res.send("API funcionando !!")
})
server.listen(appexpress.get('port'), appexpress.get('host'), () => {
    console.log(`Server listening on ${host}:${port}`)
})

socket.listenInConnect()
socket.listenInConnection()



function createWindow() {
    let win = new BrowserWindow({
        width: 360,
        height: 600,
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
        },
        transparent: true,
        frame: false,
        icon: 'logo.ico',
        center: true,
        maximizable: false
    })
    win.loadFile('./src/index.html')
    win.removeMenu()    
    global._port = port
    global._host = host
}

function createTray() {
    let tray = new Tray('logo.ico')
    const ctx = Menu.buildFromTemplate([
        { label: 'Ver conexión', type: 'normal' },
        { label: 'Reiniciar app', type: 'normal' },
        { type: 'separator' },
        { label: 'Cerrar todo', type: 'normal' }
    ])
    tray.setContextMenu(ctx)
    tray.setTitle("app server")
    tray.setToolTip("Ejecucion en segundo plano")
    tray.setImage('logo.ico')
    tray.displayBalloon({
        title: 'Hola mundo',
        content: 'Esto es el icono de segundo plano',
        iconType: 'info',
        icon: 'logo.ico'
    })
}

app.on('ready', () => {
    createWindow()
    createTray()
})