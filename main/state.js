const state = {
    host: null,
    port: 8080,
    window: null
}

function initializeRuntimeState({ host, port }) {
    setHost(host)
    setPort(port)
    resetDeviceState()
    global._fix = false
}

function setMainWindow(windowInstance) {
    state.window = windowInstance
}

function getMainWindow() {
    return state.window
}

function setHost(host) {
    state.host = host
    global._host = host
}

function getHost() {
    return state.host
}

function setPort(port) {
    state.port = port
    global._port = port
}

function getPort() {
    return state.port
}

function resetDeviceState() {
    global._system = null
    global._device = null
    global._uuid = null
}

module.exports = {
    getHost,
    getMainWindow,
    getPort,
    initializeRuntimeState,
    resetDeviceState,
    setHost,
    setMainWindow,
    setPort
}
