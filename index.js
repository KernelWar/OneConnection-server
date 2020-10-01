const { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain } = require('electron')

const express = require('express')
const http = require('http')
const ip = require('ip')
const cors = require('cors')
const fs = require('fs')

const path = require('path')
const appexpress = express()
let server = http.createServer(appexpress)
let socket = require('./socket/socket-app')

//console.log(process.env.ELECTRON_ENABLE_LOGGING)
process.env.NODE_ENV = "production"

const iconPath = path.join(__dirname, '/logo.png')
//server.maxConnections = 1
//server.setMaxListeners = 2

socket.initServer(server)

var host = ip.address()
var port = 8080
let win
let pathConfigServer
let pathConfigFixDevice

if(process.env.NODE_ENV == 'production'){
    addLog('PRODUCTION')
    console.log("----PRODUCTION-----")
    global._pathApp = process.resourcesPath+"/app.asar.unpacked"
    pathConfigServer = global._pathApp+"/config/configServer.json"
    pathConfigFixDevice = global._pathApp+"/config/fixDevice.json"
}else{
    addLog('DEVELOPMENT')
    console.log("----DEVELOPMENT-----")
    global._pathApp = __dirname
    pathConfigServer = (path.join(__dirname, 'config/configServer.json'))
    pathConfigFixDevice = (path.join(__dirname, 'config/fixDevice.json'))
}


fs.readFile(pathConfigServer,function (err, data){
    if(err){
        console.log(err)
        addLog(err)
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

function addLog(data){
    //dialog.showMessageBox({title: 'hola',message:data})
    data = "\n\n"+data
    fs.appendFileSync('C:/Users/Jose/Desktop/config/logs.txt',data, { encoding: "utf8", flag: "w" } )
}




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
    fs.writeFileSync(pathConfigFixDevice, JSON.stringify(data), function(err){
        if(err){
            console.log(err)
            addLog(err)
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
    fs.writeFileSync(pathConfigFixDevice, JSON.stringify(data), function(err){
        if(err){
            console.log(err)
            addLog(err)
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
    fs.writeFileSync(pathConfigServer, JSON.stringify(data), function(err){
        if(err){
            console.log(err)
            addLog(err)
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
            //nodeIntegrationInWorker: true,
            enableRemoteModule: true
        },
        transparent: true,
        frame: false,
        center: true,
        maximizable: false
    })
    win.loadFile('src/index.html')
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
    tray.setContextMenu(ctx)
})