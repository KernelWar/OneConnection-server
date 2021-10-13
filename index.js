/*
//para detectar Error: spawn ENOENT
(function() {
    var childProcess = require("child_process");
    var oldSpawn = childProcess.spawn;
    function mySpawn() {
        console.log('spawn called');
        console.log(arguments);
        var result = oldSpawn.apply(this, arguments);
        return result;
    }
    childProcess.spawn = mySpawn;
})();
*/
const environment = require('./environment/environment')
const { app, BrowserWindow, nativeImage, ipcMain, shell } = require('electron')
const log = require('electron-log');
const { autoUpdater } = require("electron-updater");

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');


const express = require('express')
const http = require('http')
const ip = require('ip')
const cors = require('cors')
const fs = require('fs')

const url = require('url')
const path = require('path')

const appexpress = express()
let server = http.createServer(appexpress)
let socket = require('./socket/socket-app')
const { isIPv4 } = require('net')
process.env.NODE_ENV = environment.env.NODE_ENV
const iconPath = path.join(__dirname, '/logo.png')

socket.initServer(server)

var host = ip.address()
console.log('IP HOST -> ', host)
var port = 8080
var win

var pathConfigServer = environment.env.pathConfigServer
var pathConfigFixDevice = environment.env.pathConfigFixDevice

fs.readFile(pathConfigServer, function (err, data) {
    if (err) {
        console.log(err)
    } else {
        if (data.isNull() == false) {
            let jsonData = JSON.parse(data)
            host = jsonData['host']
            port = jsonData['port']
            if (!isIPv4(host) || host != ip.address()) {
                host = ip.address()
            }
            if (!Number(port)) {
                port = 8080
            }
        } else {
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

        appexpress.post("/requestConnection", function (res, req) {
            let status = {
                message: "server ready"
            }
            if (socket.clientConnected() == false) {
                //server disponible - Acceso concedido
                req.status(200).send(status)
            } else {
                //server lleno - Acceso denegado
                console.log("requestConnection -> ", res.body, "-> ", socket.getTimeNow())
                console.log("Server full - faild request -> ", socket.getTimeNow())
                status.message = "server complete"
                req.status(200).send(status)
            }
        })

        socket.listenInConnect()
        socket.listenInConnection()
    }
})


ipcMain.on("setHost", (event, newhost) => {
    global._host = newhost;
    appexpress.set('host', newhost)
    host = newhost
});

ipcMain.on("setPort", (event, newport) => {
    global._port = newport;
    appexpress.set('port', newport)
    port = newport
});

ipcMain.on("desconectClient", (event) => {
    socket.desconectedClient()
    removeDevice()
})

ipcMain.on("fixConnection", (event) => {
    let data = {
        system: global._system,
        device: global._device,
        uuid: global._uuid
    }
    fs.writeFileSync(pathConfigFixDevice, JSON.stringify(data), function (err) {
        if (err) {
            console.log(err)

        }
    })
})

ipcMain.on("removefixConnection", (event) => {
    deleteDeviceFixed()
})

function deleteDeviceFixed() {
    let data = {
        system: '',
        device: '',
        uuid: ''
    }
    fs.writeFileSync(pathConfigFixDevice, JSON.stringify(data), function (err) {
        if (err) {
            console.log(err)
        }
    })
}

ipcMain.on("resetSocketServer", (event) => {
    writeFileServerConfiguration()
    resetSocketServer()
});


ipcMain.on("closeAll", (event) => {
    socket.deleteSocketServer()
    server.close()
    win.close()
});


function removeDevice() {
    global._system = null
    global._device = null
    if (global._fix == true) {
        deleteDeviceFixed()
    }
}

function writeFileServerConfiguration() {
    let data = {
        host,
        port
    }
    fs.writeFileSync(pathConfigServer, JSON.stringify(data), function (err) {
        if (err) {
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

//Eventos main process
ipcMain.on("getDataStreamWebContent", (source) => {
    win.webContents.send("getDataStream", source)
})

ipcMain.on("activateStreamWebContent", (source) => {
    console.log('-> Activate stream')
    win.webContents.send("activateStream", source)
})

ipcMain.on("stopStreamWebContent", () => {
    console.log('-> Stop stream')
    win.webContents.send("stopStream")
})

ipcMain.on("finalizeStreamWebContent", () => {
    console.log('-> Finalize stream')
    win.webContents.send("finalizeStream")
})


ipcMain.on("checkUpdateApp", () => {
    autoUpdater.checkForUpdatesAndNotify();
})

ipcMain.on("openPayPal", () => {
    shell.openExternal("https://paypal.me/KernelWar?locale.x=es_XC")
})

const instances = app.requestSingleInstanceLock()

if (instances == false) {
    app.exit()
} else {

    app.on('ready', () => {
        win = new BrowserWindow({
            width: 360,
            height: 600,
            resizable: false,
            webPreferences: {
                nodeIntegration: true,
                //nodeIntegrationInWorker: true,
                enableRemoteModule: true,
                contextIsolation: false
            },
            transparent: true,
            frame: false,
            center: true,
            maximizable: false,
            show: false
        })
        //win.loadFile('src/index.html')
        win.loadURL(url.format({
            pathname: path.join(__dirname, "src/index.html"),
            protocol: 'file',
            slashes: true
        }))
        win.removeMenu()
        win.setIcon(nativeImage.createFromPath(iconPath))
        win.once('ready-to-show', () => {
            win.show()
            //win.webContents.send("hola")
        })
        if (process.env.NODE_ENV != 'production') {
            win.webContents.openDevTools()
        }
        //autoUpdater.checkForUpdatesAndNotify();
        /*
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
            */
    })

}

function sendStatusToWindow(text) {
    console.log(text)
    win.webContents.send("status-update", text);
}

autoUpdater.on('checking-for-update', () => {
    sendStatusToWindow('Buscando actualizaciones...');
})
autoUpdater.on('update-available', (info) => {
    sendStatusToWindow('Hay una nueva versión');
    log.info('info', info);
})
autoUpdater.on('update-not-available', (info) => {
    sendStatusToWindow('No hay actualizaciones');
    log.info('info', info);
})
autoUpdater.on('error', (err) => {
    sendStatusToWindow('No se pudo actualizar');
    log.info('err', err);
})

autoUpdater.on('download-progress', (progressObj) => {
    var speed = 0
    var textSpeed = ""
    if (progressObj.bytesPerSecond > 1024 * 1024) {
        speed = progressObj.bytesPerSecond / 1024 / 1024
        speed = speed.toFixed(2)
        textSpeed = speed + " Mb/s"
    } else {
        speed = progressObj.bytesPerSecond / 1024
        speed = speed.toFixed(2)
        textSpeed = speed + " Kb/s"
    }
    let log_message = textSpeed;
    log_message += "<br>" + (progressObj.percent).toFixed(2) + '%';
    log_message = "<br>" + log_message + ' (' + (progressObj.transferred / 1024 / 1024).toFixed(2) + "Mb/" + (progressObj.total / 1024 / 1024).toFixed(2) + 'Mb)';
    sendStatusToWindow(log_message);
    //log.info('progressObj', progressObj);
})
autoUpdater.on('update-downloaded', (info) => {
    sendStatusToWindow('Descarga finalizada');
    log.info('info', info);
    // Wait 5 seconds, then quit and install
    setTimeout(function () {
        autoUpdater.quitAndInstall();
    }, 5000)
});