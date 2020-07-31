const { app, BrowserWindow } = require('electron')

const express = require('express')
const http = require('http')
const ip = require('ip')
const cors = require('cors')
const socket = require('./socket/socket-app')
const store = new(require('electron-store'));
const appexpress = express()
const server = http.createServer(appexpress)
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
    store.set('m.kw.host', host)
    store.set('m.kw.port', port)
    console.log(`Server listening on ${host}:${port}`)
})
socket.listenInConnect()
socket.listenInConnection()

function createWindow() {
    const win = new BrowserWindow({
        width: 360,
        height: 600,
        resizable: false,
        webPreferences: {
            nodeIntegration: true
        },
        icon: 'logo.ico',
        center: true,
    
    })
    win.loadFile('./public/index.html')
    win.removeMenu()
}

app.on('ready', createWindow)