const { screen } = require('electron')
const ffi = require('ffi-napi')
var s = 10

var user32 = ffi.Library('user32', {
    'SetCursorPos': ['long', ['long', 'long']],
    'mouse_event': ['void', ['int', 'int', 'int', 'int', 'int']],
    'SystemParametersInfoA': ['void', ['int', 'int', 'int', 'int']]
});
const MOUSEEVENTF_LEFTDOWN = 0x02
const MOUSEEVENTF_LEFTUP = 0x04

const MOUSEEVENTF_RIGHTDOWN = 0x08
const MOUSEEVENTF_RIGHTUP = 0x10


const SPI_SETMOUSESPEED = 0x0071



timeFastTouch = 100
timeSlowTouch = 0

function moveMouse(coords) {
    //Tiempo mas rapido 1583
    let cursor = screen.getCursorScreenPoint()
    var x = cursor.x
    var y = cursor.y
    var ix = cursor.x
    var iy = cursor.y
    if (coords.speed > 11.6 && coords.speed <= 67) {
        s = 20 - parseInt((coords.speed * 20) / 67)
        if (s == 0) {
            s = 1
        }
    } else if (coords.speed < 11.6) {
        s = 20
    } else if (coords.speed > 67) {
        s = 1
    }
    //console.log("coords.speed: ", coords.speed, " s: ", s)
    setSpeedMouse(s)

    if (coords.x == "-x" && coords.y == "+y") {
        while (ix >= (ix - s) && iy >= (y - s)) {
            ix--;
            iy--;
            user32.SetCursorPos(ix, iy)
        }
    } else if (coords.x == "+x" && coords.y == "+y") {
        while (ix <= (ix + s) && iy >= (y - s)) {
            ix++;
            iy--;
            user32.SetCursorPos(ix, iy)
        }
    } else if (coords.x == "+x" && coords.y == "-y") {
        while (ix <= (ix + s) && iy <= (y + s)) {
            ix++;
            iy++;
            user32.SetCursorPos(ix, iy)
        }
    } else if (coords.x == "-x" && coords.y == "-y") {
        while (ix >= (ix - s) && iy <= (y + s)) {
            ix--;
            iy++;
            user32.SetCursorPos(ix, iy)
        }
    }

    if (coords.x == "x" && coords.y == "+y") {
        while (iy >= (y - s)) {
            iy--;
            user32.SetCursorPos(ix, iy)
        }
    } else if (coords.x == "x" && coords.y == "-y") {
        while (iy <= (y + s)) {
            iy++;
            user32.SetCursorPos(ix, iy)
        }
    } else if (coords.x == "-x" && coords.y == "y") {
        if (s == 15) {
            s == 25
        }
        while (ix >= (x - s)) {
            ix--;
            user32.SetCursorPos(ix, iy)
        }
    } else if (coords.x == "+x" && coords.y == "y") {
        if (s == 15) {
            s == 25
        }
        while (ix <= (x + s)) {
            ix++;
            user32.SetCursorPos(ix, iy)
        }
    }
    setSpeedMouse(10)
        // console.log(screen.getCursorScreenPoint())
}

function setSpeedMouse(speed) {
    user32.SystemParametersInfoA(SPI_SETMOUSESPEED, 0, speed, 0);
}

function clickLeft() {
    let cursor = screen.getCursorScreenPoint();
    var x = cursor.x
    var y = cursor.y
    user32.mouse_event(MOUSEEVENTF_LEFTDOWN, x, y, 0, 0);
    user32.mouse_event(MOUSEEVENTF_LEFTUP, x, y, 0, 0);
}

function clickRight() {
    let cursor = screen.getCursorScreenPoint();
    var x = cursor.x
    var y = cursor.y
    user32.mouse_event(MOUSEEVENTF_RIGHTDOWN, x, y, 0, 0);
    user32.mouse_event(MOUSEEVENTF_RIGHTUP, x, y, 0, 0);
}

module.exports = { moveMouse, clickLeft, clickRight, setSpeedMouse }