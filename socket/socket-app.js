const socket = require('socket.io')
const volume = require('../api-win/volume-win')
const mouse = require("../api-win/mouse-win")
const brightness = require("../api-win/brightness-win")
const battery = require("../api-win/battery-win")
const directories = require("../api-win/directories-win")
const shorcutsMedia = require("../api-win/shortcuts-media-win");
const session = require("../api-win/session-win")
const os = require('os')
const os_utils = require('os-utils');    
let io = null
function initServer(server) {
    io = socket(server)
    
    const checkConnected = setInterval(() => {
        if (clientConnected() == false) {
            global._system = null
            global._device = null
        }
    }, 1000)
    const updateData = setInterval(() => {
        dataInit()
    }, (60000 * 5))    
}


function listenInConnect() {
    io.on('connect', () => {
        console.log('cliente conectado')
        dataInit()

    })
}
function listenMouseModule(socket){
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
function listenDirectoryModule(socket){
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
function listenMediaModule(socket){
    socket.on("setVolume", vol => {
        volume.setVolume(vol)
    })
    socket.on("getVolume", () => {
        volume.getVolume().then((vol) => {
            io.emit("onVolume", vol)
        })
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
function listenSesionModule(socket){
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

    setInterval(() => {  
        /*  
        os_utils.cpuFree(function(f){
            let free = parseInt(f*100)
            let cpu = {
                free: (free)+"%",
                used: 100-(free)+"%"
            }
            console.log(cpu)
        })
        */        
        os_utils.cpuUsage(function(v){        
            let mdis = os_utils.freememPercentage()*100
            let mUsed = 100-mdis
            let infoPc = {
                cpu: Math.round((v*100)) ,
                memory: parseInt(mUsed),
                pc: os.hostname()
            }
            socket.emit("onInfoPC", infoPc)        
        });
    },1000);
}
function listenInConnection() {
    io.on("connection", socket => {
        socket.on("onDevice", (data) => {
            console.log("onDevice: ", data)
            global._system = data.system
            global._device = data.device
        })

        socket.on("setBrightness", (value) => {
            let b = value / 100
            brightness.setBrightness(b)
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
function dataInit() {
    if (clientConnected()) {        
        console.log("update data -> ",getTimeNow())
        volume.getVolume().then((vol) => {
            io.emit("onVolume", vol)
        })

        brightness.getBrightness().then((level) => {
            io.emit("onBrightness", level)
        })

        battery.getBatteryLevel().then((level) => {
            //console.log("battery: ",level)
            if (level) {
                io.emit("onBattery", (level * 100))
            } else {
                io.emit("onBattery", 0)
            }
        })
        sendUserName()
        console.log("status-connection -> conected "+getTimeNow())
    }else{
        console.log("status-connection -> waiting "+getTimeNow())
    }
}
function sendUserName() {
    let username = os.userInfo().username
    io.emit("onUserName", username)
}

function clientConnected() {
    let clients = io.engine.clientsCount
    if (clients != 0) {
        return true
    }
    return false
}


function getTimeNow(){
    let date = new Date()
    let time = "["+date.getHours() +":"+date.getMinutes()+":"+date.getSeconds()+"]"
    return time
}
module.exports = { initServer, listenInConnect, listenInConnection }
