const socket = require('socket.io')
const mouse = require("../api-win/mouse-win")
const volume = require("win-audio").speaker
const nircmd = require('nircmd')
const WmiClient = require('wmi-client')
const battery = require('battery-level')
const directories = require("../api-win/directories-win")
const shorcutsMedia = require("../api-win/shortcuts-media-win")
const session = require("../api-win/session-win")
const os = require('os')
const fs = require('fs')
const os_utils = require('os-utils');
let io = null
//Monitores
let checkConnected = null
let updateData = null
let cpuMonitor = null
const path = require('path')
const environment = require('./../environment/environment')
let query = 'SELECT CurrentBrightness,InstanceName FROM WmiMonitorBrightness';
let wmi = new WmiClient({
    host: 'localhost',
    namespace: '\\\\root\\WMI'
})

function initServer(server) {
    io = socket(server)
    if (io) {
        console.log("socket inicializado")
    } else {
        console.log("socket no inicializado")
    }
    checkConnected = setInterval(() => {
        if (clientConnected() == false) {
            global._system = null
            global._device = null
        }
    }, 1000)
    updateData = setInterval(() => {
        dataInit()
    }, (60000 * 5))
}

function deleteSocketServer() {
    clearInterval(checkConnected)
    clearInterval(updateData)
    clearInterval(cpuMonitor)
    io = null
}

function listenInConnect() {
    io.on('connect', (socket) => {
        console.log('cliente conectado ', socket.id)
        //console.log('client -> ',socket)
        dataInit()

    })
}
function listenMouseModule(socket) {
    socket.on("movemouse", coords => {
        mouse.moveMouse(coords)
    });

    socket.on("clickLeft", () => {
        mouse.clickLeft()
    })
    socket.on("clickRight", () => {
        mouse.clickRight()
    })

    socket.on("setSpeedMouse", (speed) => {
        mouse.setSpeedMouse(speed)
    })
    socket.on("getScroll", () => {
        mouse.getScrollPos()
    })
    socket.on("moveScrollDown", () => {
        mouse.moveScrollDown()
    })
    socket.on("moveScrollUp", () => {
        mouse.moveScrollUp()
    })
}
function listenDirectoryModule(socket) {
    socket.on("getDisks", () => {
        let wait = Promise.resolve(directories.getDiskInfo())
        wait.then((data) => {
            socket.emit("onDisks", data)
            console.log("onDisks -> OK")
        })
    })

    socket.on("getDirectory", (dir) => {
        let wait = Promise.resolve(directories.getDiretory(dir))
        wait.then(data => {
            socket.emit("onDirectory", data)
            console.log("onDirectory -> OK")
        }).catch(error => {
            console.log("error recivido: ", error)
            socket.emit("onDirectory", "fail")
            console.log("onDirectory -> FAIL")
        })
    })
    socket.on("executeFile", (dir) => {
        let wait = Promise.resolve(directories.executeFile(dir))
        wait.then((res) => {
            socket.emit("onExecuteFile", res)
            console.log("onExecuteFile -> OK")
        }).catch((error) => {
            socket.emit("onExecuteFile", "fail")
            console.log("onExecuteFile -> FAIL")
        })
    })
}
function listenMediaModule(socket) {
    socket.on("setVolume", vol => {
        volume.set(vol)
    })
    socket.on("getVolume", () => {
        io.emit("onVolume", volume.get())
    })
    socket.on("playOrPause", () => {
        shorcutsMedia.play()
    })
    socket.on("backMedia", () => {
        shorcutsMedia.back()
    })
    socket.on("nextMedia", () => {
        shorcutsMedia.next()
    })
}
function listenSesionModule(socket) {

    let commandCmd = null
    commandCmd = environment.env.global+ "/config/displayOff.bat"

    socket.on("offScreen", () => {
        let message = {
            error: false,
            status: '',
            message: ''
        }
        const cmd = require('node-cmd');
        let wait = new Promise((resolve, reject) => {
            cmd.get("start /B \"\" \"" + commandCmd+"\"", function (err, data) {
                if (err) {
                    console.log(err)
                    message.error = true
                    message.status = 'fail'
                    message.message = err
                    reject(message)
                } else {
                    message.error = false
                    message.status = 'success'
                    message.message = 'Pantalla apagada'
                    resolve(message)
                }
            })
        }).then((data) => {
            socket.emit("onStatusSession", data)
        }).catch((error) => {
            socket.emit("onStatusSession", error)
        })
    })

    socket.on("turnOffPC", () => {
        session.turnOff().then((data) => {
            socket.emit("onStatusSession", data)
        }).catch((error) => {
            socket.emit("onStatusSession", error)
        })
    })

    socket.on("restartPC", () => {
        session.restart().then((data) => {
            socket.emit("onStatusSession", data)
        }).catch((error) => {
            socket.emit("onStatusSession", error)
        })
    })
    socket.on("suspendPC", () => {
        session.suspend().then((data) => {
            socket.emit("onStatusSession", data)
        }).catch((error) => {
            socket.emit("onStatusSession", error)
        })
    })
    socket.on("lockPC", () => {
        session.lock().then((data) => {
            socket.emit("onStatusSession", data)
        }).catch((error) => {
            socket.emit("onStatusSession", error)
        })
    })

    cpuMonitor = setInterval(() => {
        os_utils.cpuUsage(function (v) {
            let mdis = os_utils.freememPercentage() * 100
            let mUsed = 100 - mdis
            let infoPc = {
                cpu: Math.round((v * 100)),
                memory: parseInt(mUsed),
                pc: os.hostname()
            }
            socket.emit("onInfoPC", infoPc)
        });
    }, 1000);
}

function loadDevice(device) {
    let data
    let dir
    dir = environment.env.pathConfigFixDevice
    data = fs.readFileSync(dir)
    if (data.isNull()) {
        let objFixNull = {
            "system": "",
            "device": "",
            "uuid": ""
        }
        fs.writeFileSync(dir, JSON.stringify(objFixNull), function (err) {
            if (err) {
                console.log(err)
            }
        })
    }
    data = fs.readFileSync(dir)
    //Si hay conexion fija
    if (data.isNull() == false) {
        let dData = JSON.parse(data)
        //Si los datos del dispositivo a conectar son iguales
        //al dispositivo fijado se realiza la conexion
        //console.log("load -> ", dData)
        //console.log("request -> ",device)
        if (dData['uuid'] == device.uuid) {
            global._system = device.system
            global._device = device.device
            global._uuid = device.uuid
            global._fix = true
            console.log("Hay connexión fija")
        } else {
            //Si es un dispositivo desconocido se niega la conexion
            //    socket.to(socket.id).emit("desconectDevice")
            // console.log("Intento de conexión denegada -> ",device.uuid) 
            if (dData['uuid'].length != 0) {
                console.log("conexion denegada -> [", dData['uuid'], "] -> ", dData['uuid'].length)
                socket.emit("desconectDevice")
            } else {
                console.log("No hay conexion fija")
                global._system = device.system
                global._device = device.device
                global._uuid = device.uuid
                global._fix = false
            }
        }
    } else {
        console.log("fix null")
    }
}

function listenInConnection() {
    io.on("connection", socket => {
        socket.on("onDevice", (device) => {
            console.log("onDevice: ", device)
            loadDevice(device)
        })
        socket.on("setBrightness", (value) => {
            nircmd(['setbrightness', value]);
        })
        socket.on("getUserName", () => {
            sendUserName()
        })

        listenMouseModule(socket)
        listenDirectoryModule(socket)
        listenMediaModule(socket)
        listenSesionModule(socket)

    });

}
function desconectedClient() {
    io.emit("desconectDevice")
}
function dataInit() {
    if (clientConnected()) {
        console.log("update data -> ", getTimeNow())
        io.emit("onVolume", volume.get())

        //console.log('ruta wmi-client -> ', global._pathApp + "/node_modules/wmi-client")
        //getBrightness
        wmi.cwd = global._pathApp + "/node_modules/wmi-client"

        wmi.query(query, function (err, res) {
            if (err) {
                console.log(err)
            } else {
                let level
                if (!res.length) {
                    level = 0
                } else {
                    level = res[0].CurrentBrightness / 100
                }
                io.emit("onBrightness", level)
                //console.log(level)
            }
        })
        battery().then((level) => {
            if (level) {
                io.emit("onBattery", (level * 100))
            } else {
                io.emit("onBattery", 0)
            }
        })
        sendUserName()
        console.log("status-connection -> conected " + getTimeNow())
    } else {
        console.log("status-connection -> waiting " + getTimeNow())
    }
}



function sendUserName() {
    let username = os.userInfo().username
    io.emit("onUserName", username)
}

function clientConnected() {
    let clients = null
    try {
        clients = io.engine.clientsCount
        if (clients != 0) {
            return true
        }
    } catch (error) {
        return false
    }
    return false
}


function getTimeNow() {
    let date = new Date()
    let time = "[" + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + "]"
    return time
}
module.exports = { initServer, listenInConnect, listenInConnection, deleteSocketServer, clientConnected, getTimeNow, desconectedClient }
