window.jQuery = window.$ = require('jquery')

const QRCode = require('qrcode')
const Mustache = require('mustache')
const os = require('os')
const { remote, ipcRenderer } = require('electron')

const canvas = document.getElementById('preview')
const context = canvas.getContext('2d')
const video = document.getElementById('video-stream')
const version = remote.app.getVersion()

let stream = null
let streamActive = false
let frames = null

const constraints = {
    audio: false,
    video: {
        mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: null,
            maxWidth: 1000,
            maxHeight: 800
        }
    }
}

$('html head').find('title').text('OneConnection server ' + version)
$('#title-frame').text('OneConnection server ' + version)

ipcRenderer.on('activateStream', (event, source) => {
    streamActive = false
    if (source.id != constraints.video.mandatory.chromeMediaSourceId) {
        console.log('Init stream')
        constraints.video.mandatory.chromeMediaSourceId = source.id
    } else {
        console.log('Resume stream')
    }

    stream = navigator.mediaDevices.getUserMedia(constraints)
    stream.then((mediaStream) => {
        video.srcObject = mediaStream
        context.drawImage(video, 0, 0, 1000, 800)
        streamActive = true
    })
})

ipcRenderer.on('getDataStream', () => {
    frames = setInterval(() => {
        if (streamActive) {
            context.drawImage(video, 0, 0, 1000, 800)
            ipcRenderer.send('onDataStream', canvas.toDataURL('image/webp', 0.7))
        }
    }, 10)
})

ipcRenderer.on('stopStream', () => {
    clearInterval(frames)
})

ipcRenderer.on('finalizeStream', () => {
    if (video.srcObject) {
        const tracks = video.srcObject.getTracks()
        tracks.forEach((track) => track.stop())
    }
    stream = null
    clearInterval(frames)
    streamActive = false
})

ipcRenderer.on('status-update', (event, text) => {
    document.getElementById('text-info-update').innerHTML = text
})

function checkUpdate() {
    ipcRenderer.send('checkUpdateApp')
}

function openPayPal() {
    ipcRenderer.send('openPayPal')
}

function setIPServer(newip) {
    ipcRenderer.send('desconectClient')
    ipcRenderer.send('setHost', newip)
    generateQR()
    $('#interfaceNetworkModdal').modal('toggle')
    ipcRenderer.send('resetSocketServer')
}

function generateQR() {
    const qrCanvas = document.getElementById('qr_ip')
    const host = remote.getGlobal('_host')
    const port = remote.getGlobal('_port')
    $('#data-host-server').text(host + ':' + port)
    QRCode.toCanvas(qrCanvas, host + ':' + port, (error) => {
        if (error) {
            console.error('qr error: ', error)
        }
    })
}

window.checkUpdate = checkUpdate
window.openPayPal = openPayPal
window.setIPServer = setIPServer

generateQR()
$('#wait-device').hide()
$('#device-info').hide()

setInterval(() => {
    if (remote.getGlobal('_fix') == true) {
        $('#fixConnection').prop('checked', true)
    }

    if (remote.getGlobal('_system') != null && remote.getGlobal('_device') != null) {
        $('#txt-system').text(remote.getGlobal('_system'))
        $('#txt-device').text(remote.getGlobal('_device'))
        $('#wait-device').hide()
        $('#device-info').show()
    } else {
        $('#device-info').hide()
        $('#wait-device').show()
    }
}, 1000)

$('#item-network').click(() => {
    const interfaces = os.networkInterfaces()
    $('#list-interface').html('')
    let networks = 0

    for (const item in interfaces) {
        networks++
        const element = interfaces[item][1]
        if (element['address'] != '127.0.0.1') {
            element['name'] = item
            $('#list-interface').append(Mustache.render($('#templateNetworkInterface').html(), element))
        }
    }

    if (networks == 1) {
        ipcRenderer.send('checkInterface')
    }
})

$('#btn-minimizade').click(function () {
    $(this).blur()
    remote.getCurrentWindow().minimize()
})

$('#btn-close').click(() => {
    ipcRenderer.send('closeAll')
})

$('#item-port').click(() => {
    $('#port-server').val(remote.getGlobal('_port'))
})

$('#btnSetPort').click(() => {
    let newPort = $('#port-server').val()
    newPort = parseInt(newPort)

    if (newPort == 80 || newPort >= 1024 && newPort <= 49151) {
        ipcRenderer.send('desconectClient')
        ipcRenderer.send('setPort', newPort)
        generateQR()
        ipcRenderer.send('resetSocketServer')
        $('#changePort').modal('toggle')
    } else {
        $('#toast-port').toast({
            delay: 4000,
            autohide: true
        })
        $('#toast-port').toast('show')
    }
})

$('#btn-delete-device').click(() => {
    ipcRenderer.send('desconectClient')
})

$('#fixConnection').change(() => {
    const status = $('#fixConnection').is(':checked')
    if (status) {
        ipcRenderer.send('fixConnection')
    } else {
        ipcRenderer.send('removefixConnection')
    }
})
