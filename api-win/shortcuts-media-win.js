const ffi = require('ffi-napi')

var user32 = ffi.Library('user32', {
    keybd_event: ["bool", ["int32", "int32", "int32", "int32"]]   
});

const VK_MEDIA_PLAY_PAUSE = 0xB3
const VK_MEDIA_NEXT_TRACK = 0xB0
const VK_MEDIA_PREV_TRACK = 0xB1
const KEYEVENTF_EXTENDEDKEY = 0x0001

function play(){
    return user32.keybd_event(VK_MEDIA_PLAY_PAUSE, 0, KEYEVENTF_EXTENDEDKEY,0)
}

function back(){
    return user32.keybd_event(VK_MEDIA_PREV_TRACK, 0, KEYEVENTF_EXTENDEDKEY,0)
}

function next(){
    return user32.keybd_event(VK_MEDIA_NEXT_TRACK, 0, KEYEVENTF_EXTENDEDKEY,0)
}

module.exports = { play, back, next }
