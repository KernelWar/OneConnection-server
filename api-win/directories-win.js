const nodeDiskInfo = require('node-disk-info')
const fs = require('fs');
const cmd = require('node-cmd');

async function getDiskInfo() {
    return await nodeDiskInfo.getDiskInfo().then(disks => {
        return createData(disks)
    })
}

function createData(disks) {
    let data = []
    disks.forEach(disk => {
        let capacity = parseInt(disk._blocks / (1.074e+9))
        let obj = {
            letter: disk._mounted,
            used: disk._capacity,
            type: disk._filesystem,
            capacity: capacity
        }
        data.push(obj)
    });
    return data
}

async function getDiretory(dir) {
    let wait = new Promise((resolve, reject) => {
        fs.readdir(dir, (err, files) => {
            if (err) {
                reject(err)
            } else {
                let data = []
                files.forEach(file => {
                    if (checkReadAutorization(dir + file)) {
                        let obj = {
                            type: checkIsFile(dir, file),
                            name: file,
                            pathFull: dir + file
                        }
                        data.push(obj)
                    }
                });
                resolve(data)
            }

        });
    })
    return wait
}

function checkReadAutorization(dirFull) {
    try {
        fs.lstatSync(dirFull).isFile()
        return true
    } catch (error) {
        return false
    }
}

function checkIsFile(dir, file) {
    if (fs.lstatSync(dir + file).isFile()) {
        return "file"
    } else {
        return "directory"
    }
}


async function executeFile(dirFull) {
    let wait = new Promise((resolve, reject) => {
        cmd.get('start \"\" \"' + dirFull + "\"", function (err, data) {
            if (err) {
                reject(err)
            } else {
                resolve("success")
            }
        })
    })
    return wait
}

async function getUserName() {
    let wait = new Promise((resolve, reject)=>{
        cmd.get('echo {%username%}', function(err,data){
            if(err){
                reject(err)
            }else{
                resolve(data)
            }
        })
    })
    return wait
}


module.exports = { getDiskInfo, getDiretory, executeFile, getUserName }