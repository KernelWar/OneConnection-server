const cors = require('cors')
const express = require('express')
const http = require('http')

function createServerManager({ socketService, onPortInUse }) {
    const appexpress = express()
    let server = null

    appexpress.use(cors())
    appexpress.use(express.json())
    registerRoutes()

    function registerRoutes() {
        appexpress.get('/', (req, res) => {
            res.send('API funcionando !!')
        })

        appexpress.post('/requestConnection', (req, res) => {
            const status = {
                message: 'server ready'
            }

            if (socketService.clientConnected() == false) {
                res.status(200).send(status)
                return
            }

            console.log('requestConnection -> ', req.body, '-> ', socketService.getTimeNow())
            console.log('Server full - faild request -> ', socketService.getTimeNow())
            status.message = 'server complete'
            res.status(200).send(status)
        })
    }

    function buildHttpServer() {
        server = http.createServer(appexpress)
        socketService.initServer(server)
        attachServerErrorHandler()
    }

    function attachServerErrorHandler() {
        server.on('error', (error) => {
            console.log('ERROR SERVER -> ', error)
            if (error.code === 'EADDRINUSE') {
                setTimeout(() => {
                    server.close()
                    onPortInUse()
                }, 1000)
            }
        })
    }

    function start({ host, port }) {
        if (!server) {
            buildHttpServer()
        }

        appexpress.set('host', host)
        appexpress.set('port', port)

        server.listen(port, host, () => {
            console.log(`Server listening on ${host}:${port}`)
        })

        socketService.listenInConnect()
        socketService.listenInConnection()
    }

    function reset({ host, port }) {
        socketService.deleteSocketServer()
        if (server) {
            server.close()
        }

        buildHttpServer()
        appexpress.set('host', host)
        appexpress.set('port', port)

        server.listen(port, host, () => {
            console.log(`Reset: Server listening on ${host}:${port}`)
        })

        socketService.listenInConnect()
        socketService.listenInConnection()
    }

    function stop() {
        socketService.deleteSocketServer()
        if (server) {
            server.close()
        }
    }

    return {
        getExpressApp: () => appexpress,
        reset,
        start,
        stop
    }
}

module.exports = {
    createServerManager
}
