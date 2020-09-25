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

//server.maxConnections = 1
//server.setMaxListeners = 2

socket.initServer(server)

var host = ip.address()
var port = 8080
let win

fs.readFile('config/configServer.json',function (err, data){
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
            //console.log("getMaxListeners -> ",server.getMaxListeners())
        })

        appexpress.post("/requestConnection", function(res, req){
            let status = {
                message: "server ready"
            }
            if(socket.clientConnected() == false){                
                //server disponible - Acceso concedido
                req.status(200).send(status)
            }else{
                //server lleno - Acceso denegado
                console.log("requestConnection -> ", res.body, "-> ",socket.getTimeNow())
                console.log("Server full - faild request -> ",socket.getTimeNow())
                status.message = "server complete"
                req.status(200).send(status)
            }
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

ipcMain.on("desconectClient", (event) =>{
    socket.desconectedClient()
    removeDevice()
})

ipcMain.on("fixConnection", (event)=>{
    let data = {
        system: global._system,
        device: global._device,
        uuid: global._uuid
    }
    fs.writeFile('config/fixDevice.json', JSON.stringify(data), function(err){
        if(err){
            console.log(err)
        }
    })
})

ipcMain.on("removefixConnection", (event)=>{
    deleteDeviceFixed()
})

function deleteDeviceFixed(){
    let data = {
        system: '',
        device: '',
        uuid: ''
    }
    fs.writeFile('config/fixDevice.json', JSON.stringify(data), function(err){
        if(err){
            console.log(err)
        }
    })
}

ipcMain.on("resetSocketServer", (event) => {  
    writeFileServerConfiguration()  
    resetSocketServer()        
});

function removeDevice(){
    global._system = null
    global._device = null
    if(global._fix == true){
        deleteDeviceFixed()
    }
}

function writeFileServerConfiguration(){
    let data = {
        host,
        port
    }
    fs.writeFile('config/configServer.json', JSON.stringify(data), function(err){
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
            
        },
        transparent: true,
        frame: false,
        center: true,
        maximizable: false
    })
    win.loadFile('./src/index.html')
    win.removeMenu()
    win.setIcon(nativeImage.createFromPath(iconPath))
    win.webContents.openDevTools()
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