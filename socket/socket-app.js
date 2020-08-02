const socket = require('socket.io')
const store = new (require('electron-store'));
const volume = require('../api-win/volume-win')
const mouse = require("../api-win/mouse-win")
const brightness = require("../api-win/brightness-win")
const battery = require("../api-win/battery-win")
const directories = require("../api-win/directories-win")
const shorcutsMedia = require("../api-win/shortcuts-media-win")
let io = null

function initServer(server) {
    io = socket(server)
    const checkConnected = setInterval(() => {
        let clients = io.engine.clientsCount
        if (clients == 0) {
            store.delete('system')
            store.delete('device')
        }
    }, 1000)
}


function listenInConnect() {
    io.on('connect', () => {
        console.log('cliente conectado')
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

        directories.getUserName().then((username)=>{
            let data = username
            let regex = /{([^}]*)}/g
            var extract = data.match(regex).toString()            
            data = extract.substring(1,extract.length-1)
            io.emit("onUserName", data)
        }).catch((error)=>{
            console.log("error username: ",error)
            io.emit("onUserName", '.fail.')
        })
    })
}

function listenInConnection() {

    io.on("connection", socket => {
        socket.on("onDevice", (data) => {
            console.log("onDevice: ", data)
            store.set("system", data.system)
            store.set("device", data.device)
        })
        socket.on("saludo", res => {
            console.log("hola mundo");
        });
        socket.on("movemouse", coords => {
            mouse.moveMouse(coords)
        });
        socket.on("setVolume", vol => {
            volume.setVolume(vol)
        })
        socket.on("getVolume", () => {
            volume.getVolume().then((vol) => {
                io.emit("onVolume", vol)
            })
        })
        socket.on("clickLeft", () => {
            mouse.clickLeft()
        })
        socket.on("clickRight", () => {
            mouse.clickRight()
        })
        socket.on("setSpeedMouse", (speed) => {
            mouse.setSpeedMouse(speed)
        })

        socket.on("setBrightness", (value) => {
            let b = value / 100
            brightness.setBrightness(b)
        })

        socket.on("getDisks", () => {
            let wait = Promise.resolve(directories.getDiskInfo())
            wait.then((data) => {
                socket.emit("onDisks", data)
            })
        })

        socket.on("getDirectory", (dir) => {
            let wait = Promise.resolve(directories.getDiretory(dir))
            wait.then(data => {
                socket.emit("onDirectory", data)
            }).catch(error => {
                console.log("error recivido: ", error)
                socket.emit("onDirectory", "fail")
            })
        })
        socket.on("executeFile", (dir) => {
            let wait = Promise.resolve(directories.executeFile(dir))
            wait.then((res) => {
                socket.emit("onExecuteFile", res)
            }).catch((error) => {
                socket.emit("onExecuteFile", "fail")
            })
        })
        socket.on("playOrPause",()=>{
            shorcutsMedia.play()
        })
        socket.on("backMedia",()=>{
            shorcutsMedia.back()
        })
        socket.on("nextMedia",()=>{
            shorcutsMedia.next()
        })
    });

}

module.exports = { initServer, listenInConnect, listenInConnection }