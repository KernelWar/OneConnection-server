const QRCode = require('qrcode');
const canvas = document.getElementById('qr_ip')

const host = store.get('m.kw.host')
const port = store.get('m.kw.port')

QRCode.toCanvas(canvas, (host + ":" + port), function(error) {
    if (error) console.error('qr error: ',error)
})