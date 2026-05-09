const fs = require('fs')
const ip = require('ip')
const { isIPv4 } = require('net')

function parseJsonFile(filePath) {
    try {
        const rawData = fs.readFileSync(filePath, 'utf8')
        if (!rawData || !rawData.trim()) {
            return null
        }
        return JSON.parse(rawData)
    } catch (error) {
        console.log(error)
        return null
    }
}

function readServerConfig(filePath) {
    const config = parseJsonFile(filePath)
    let host = ip.address()
    let port = 8080

    if (config) {
        host = config.host
        port = config.port

        if (!isIPv4(host) || host != ip.address()) {
            host = ip.address()
        }

        if (!Number(port)) {
            port = 8080
        }
    }

    return { host, port }
}

function writeServerConfig(filePath, config) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(config))
    } catch (error) {
        console.log(error)
    }
}

function writeFixedDevice(filePath, device) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(device))
    } catch (error) {
        console.log(error)
    }
}

function clearFixedDevice(filePath) {
    writeFixedDevice(filePath, {
        system: '',
        device: '',
        uuid: ''
    })
}

module.exports = {
    clearFixedDevice,
    readServerConfig,
    writeFixedDevice,
    writeServerConfig
}
