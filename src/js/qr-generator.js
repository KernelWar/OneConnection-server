
const canvas = document.getElementById('qr_ip')

const host = remote.getGlobal('_host')
const port = remote.getGlobal('_port')
$("#data-host-server").text((host+":"+port))
QRCode.toCanvas(canvas, (host + ":" + port), function(error) {
    if (error) console.error('qr error: ',error)
})