const cmd = require('node-cmd');
const path = require('path')
let message = {
    error: false,
    status: '',
    message: ''
}

async function turnOff() {
    let wait = new Promise((resolve, reject) => {
        cmd.get("shutdown /s /t 5", function (err, data) {
            if (err) {
                console.log(err)
                message.error = true
                message.status = 'fail'
                message.message = err
                reject(message)
            } else {
                message.error = false
                message.status = 'success'
                message.message = 'Su PC se apagará en 5s'
                resolve(message)
            }
        })
    })
    return wait
}

async function restart() {
    let wait = new Promise((resolve, reject) => {
        cmd.get("shutdown /r /t 5", function (err, data) {
            if (err) {
                console.log(err)
                message.error = true
                message.status = 'fail'
                message.message = err
                reject(message)
            } else {
                message.error = false
                message.status = 'success'
                message.message = 'Su PC se reiniciará en 5s'
                resolve(message)
            }
        })
    })
    return wait
}

async function suspend() {
    let wait = new Promise((resolve, reject) => {
        cmd.get("rundll32.exe PowrProf.dll, SetSuspendState", function (err, data) {
            if (err) {
                console.log(err)
                message.error = true
                message.status = 'fail'
                message.message = err
                reject(message)
            } else {
                message.error = false
                message.status = 'success'
                message.message = 'PC en suspención'
                resolve(message)
            }
        })
    })
    return wait
}

async function lock() {
    let wait = new Promise((resolve, reject) => {
        cmd.get("rundll32.exe user32.dll,LockWorkStation", function (err, data) {
            if (err) {
                console.log(err)
                message.error = true
                message.status = 'fail'
                message.message = err
                reject(message)
            } else {
                message.error = false
                message.status = 'success'
                message.message = 'PC bloqueada'
                resolve(message)
            }
        })
    })
    return wait
}


module.exports = { turnOff, restart, suspend, lock }