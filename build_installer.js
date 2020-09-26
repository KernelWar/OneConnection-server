const { MSICreator } = require('electron-wix-msi');
const path = require('path');

const APP_DIR = path.resolve(__dirname, './out/mouse-win32-x64');
const OUT_DIR = path.resolve(__dirname, './windows_installer');

const msiCreator = new MSICreator({
    appDirectory: APP_DIR,
    outputDirectory: OUT_DIR,

    description: 'Probando creacion de msi',
    exe: 'CKS',
    name: 'Control Kernel Server',
    manufacturer: 'KernelWar',
    version: '1.0.0',
    appIconPath: 'logo.ico',
    ui: {
        chooseDirectory: true
    },
});

//Create a .wxs template file
msiCreator.create().then(function(){

    // Compile the template to a .msi file
    msiCreator.compile();
});