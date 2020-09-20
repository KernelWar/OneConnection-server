const { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain } = require('electron')

const express = require('express')
const http = require('http')
const ip = require('ip')
const cors = require('cors')
const appexpress = express()
let server = http.createServer(appexpress)
let socket = require('./socket/socket-app')
const path = require('path')
const fs = require('fs')

const iconPath = path.join(__dirname, 'logo.png');
socket.initServer(server)

var host = ip.address()
var port = 8080
let win

fs.readFile('configServer.json',function (err, data){
    if(err){
        console.log(err)
    }else{ 
        if(data.isNull() == false){
            let jsonData = JSON.parse(data)
            host = jsonData['host']
            port = jsonData['port']
           
           
        }else{
            host = ip.address()
            port = 8080
        }
                     
        appexpress.use(cors())
        appexpress.use(express.json())
        appexpress.set('port', port)
        appexpress.set('host', host)
                
        global._port = port
        global._host = host
        appexpress.get('/', (req, res) => {
            res.send("API funcionando !!")
        })
        server.listen(appexpress.get('port'), appexpress.get('host'), () => {
            console.log(`Server listening on ${host}:${port}`)
        })

        socket.listenInConnect()
        socket.listenInConnection()
    }
})



ipcMain.on("setHost", (event,newhost) => {
    global._host = newhost;
    appexpress.set('host', newhost)
    host = newhost
});

ipcMain.on("setPort", (event,newport) => {
    global._port = newport;
    appexpress.set('port', newport)
    port = newport
});

ipcMain.on("resetSocketServer", (event) => {  
    writeFileServerConfiguration()  
    resetSocketServer()        
});

function writeFileServerConfiguration(){
    let data = {
        host,
        port
    }
    fs.writeFile('configServer.json', JSON.stringify(data), function(err){
        if(err){
            console.log(err)
        }
    })
}


function resetSocketServer() {
    socket.deleteSocketServer()
    server.close()
    server = http.createServer(appexpress)
    socket.initServer(server) 
    server.listen(appexpress.get('port'), appexpress.get('host'), () => {
        console.log(`Reset: Server listening on ${host}:${port}`)
    })  
    socket.listenInConnect()
    socket.listenInConnection()
   
}

app.on('ready', () => {
    win = new BrowserWindow({
        width: 360,
        height: 600,
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            //devTools: true
        },
        transparent: true,
        frame: false,
        center: true,
        maximizable: false
    })
    win.loadFile('./src/index.html')
    win.removeMenu()
    win.setIcon(nativeImage.createFromPath(iconPath))
    
    let tray = new Tray(iconPath)

    const ctx = Menu.buildFromTemplate([
        {
            label: 'Ver conexión',
            type: 'normal',
            click: () => {
                win.show()
            }
        },
        {
            label: 'Reiniciar app',
            type: 'normal',
            click: () => {
                resetSocketServer()
                app.relaunch()
                app.quit()

            }
        },
        { type: 'separator' },
        {
            label: 'Cerrar todo',
            type: 'normal',
            click: () => {
                server.close()
                app.exit()
            }
        }
    ])
    /*
    tray.setTitle("app server")
    tray.setToolTip("Ejecucion en segundo plano")
    tray.setImage(nativeImage.createFromPath(iconPath))
    tray.displayBalloon({
        title: 'Hola mundo',
        content: 'Esto es el icono de segundo plano',
        iconType: 'info',
        icon: iconPath
    })
*/
    tray.setContextMenu(ctx)
})