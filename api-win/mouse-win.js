const { screen } = require('electron')
const ffi = require('ffi-napi')
const ref = require('ref-napi')

var winapi = {};
winapi.void = ref.types.void;
winapi.PVOID = ref.refType(winapi.void);
winapi.HANDLE = winapi.PVOID;
winapi.HWND = winapi.HANDLE;

/*
winapi.bool = ref.types.bool;
winapi.int = ref.types.int;
winapi.ulong = ref.types.ulong;
winapi.void = ref.types.void;
winapi.PVOID = ref.refType(winapi.void);
winapi.HANDLE = winapi.PVOID;
winapi.HWND = winapi.HANDLE;
winapi.WCHAR = ref.types.char;
winapi.LPCWSTR = ref.types.CString;
winapi.UINT = ref.types.uint;
*/

/*
SetScrollPos: ['int32', [winapi.HWND, 'int', 'int', 'bool']],
    GetScrollPos: ['int32', [winapi.HWND, 'int32']],
    GetFocus: [winapi.HWND, []],
    GetActiveWindow: [winapi.HWND, []],
    GetCapture: [winapi.HWND, []],
    GetForegroundWindow: [winapi.HWND, []],
*/
var user32 = ffi.Library('user32', {
    SetCursorPos: ['long', ['long', 'long']],
    mouse_event: ['void', ['int', 'int', 'int', 'int', 'int']],
    SystemParametersInfoA: ['int', ['int', 'int', winapi.PVOID, 'int']],
});


var s = 10

const MOUSEEVENTF_LEFTDOWN = 0x02
const MOUSEEVENTF_LEFTUP = 0x04

const MOUSEEVENTF_RIGHTDOWN = 0x08
const MOUSEEVENTF_RIGHTUP = 0x10


const SPI_SETMOUSESPEED = 0x0071
const SPI_GETMOUSESPEED = 0x0070
/*
const SB_HORZ = 0;
const SB_VERT = 1;
const SB_CTL = 2;
*/
const MOUSEEVENTF_WHEEL = 0x0800

//VALOR DE VELOCIDAD QUE WINDOWS TIENE POR DEFAULT
const SPEEDMOUSE = getSpeedMouse()


function moveScrollDown() {
    user32.mouse_event(MOUSEEVENTF_WHEEL, 0, 0, -20, 0);
}
function moveScrollUp() {
    user32.mouse_event(MOUSEEVENTF_WHEEL, 0, 0, 20, 0);
}

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
    setSpeedMouse(SPEEDMOUSE)
    // console.log(screen.getCursorScreenPoint())
}

function setSpeedMouse(speed) {
    var setSpeed = new Buffer(4)
    setSpeed.writeInt32LE(speed, 0)
    user32.SystemParametersInfoA(SPI_SETMOUSESPEED, 0, setSpeed, 0);
}

function getSpeedMouse() {
    var getSpeed = new Buffer(4)
    user32.SystemParametersInfoA(SPI_GETMOUSESPEED, 0, getSpeed, 0);
    getSpeed.type = ref.types.int
    //console.log("speed: ", getSpeed.deref())
    return getSpeed.deref()
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

module.exports = {
    moveMouse,
    clickLeft,
    clickRight,
    setSpeedMouse,
    moveScrollDown,
    moveScrollUp
}